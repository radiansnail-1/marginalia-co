"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { searchBooks, GoogleBooksApiError, type GoogleBook } from "@/lib/books/google-books";
import { isbnSearchQuery, normalizeIsbn } from "@/lib/books/isbn";
import { searchOpenLibraryBooks, type OpenLibraryBook } from "@/lib/books/open-library";
import { missingBookMetadataPatch, type ExistingBookMetadata } from "./book-metadata";
import { applyShelfStatuses, type ShelfTaggedBook } from "./shelf-status";

export type { UserBookStatus } from "./shelf-status";
type SearchResult = GoogleBook & {
  resultKey: string;
  source: "catalog" | "google" | "openlibrary";
  catalogBookId: string | null;
};
export type SearchBook = ShelfTaggedBook<SearchResult>;

export type SearchActionResult =
  | {
      ok: true;
      books: SearchBook[];
      meta: {
        elapsedMs: number;
        partial: boolean;
        sources: Record<SearchResult["source"], number>;
        unavailable: Array<"google" | "openlibrary" | "catalog">;
      };
    }
  | { ok: false; error: "api" | "rate-limit" | "timeout" | "unknown"; books: [] };

// Strip edition/format suffixes so different printings collapse into one row.
// "Katabasis: Standard Edition" → "katabasis", "The Bell Jar (Deluxe)" → "the bell jar".
const EDITION_PATTERNS = [
  /\b(?:standard|special|deluxe|collector'?s?|anniversary|illustrated|annotated|expanded|extended|abridged|unabridged|revised|updated|definitive|complete|reissue|signed|hardcover|paperback|trade|mass[- ]market|kindle|audio|ebook|enhanced|premium)\s+edition\b/gi,
  /\b(?:edition|ed\.?)\s*[:\-–—]?\s*(?:\d+(?:st|nd|rd|th)?|i{1,3}|iv|v|vi{1,3}|ix|x)\b/gi,
  /\((?:[^()]*(?:edition|ed\.?|reprint|reissue|hardcover|paperback)[^()]*)\)/gi,
  /\[[^\]]*(?:edition|ed\.?|reprint|reissue|hardcover|paperback)[^\]]*\]/gi,
  /\bvol(?:\.|ume)?\s*\d+\b/gi,
];

function normalizeTitle(t: string): string {
  let out = t.toLowerCase();
  for (const p of EDITION_PATTERNS) out = out.replace(p, " ");
  out = out.replace(/[:;\-–—]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return out;
}

function dedupByEdition<T extends { title: string; author: string }>(books: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const b of books) {
    const key = normalizeTitle(b.title) + "|" + (b.author || "").toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}

function searchText(value: string): string {
  return value.toLowerCase().replace(/[,%*_()]/g, " ").replace(/\s+/g, " ").trim();
}

function catalogPattern(value: string): string {
  return `%${value.replace(/[%_*,()]/g, " ").replace(/\s+/g, "%")}%`;
}

type CatalogBookRow = {
  id: string;
  google_books_id: string | null;
  open_library_id: string | null;
  isbn_13: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  page_count: number | null;
  published_year: number | null;
  subjects: string[] | null;
};

const BOOK_METADATA_SELECT =
  "id, google_books_id, open_library_id, isbn_13, cover_url, description, page_count, published_year, subjects";

type ExistingBookRow = ExistingBookMetadata & { id: string };

function catalogScore(book: CatalogBookRow, query: string, isbn: string | null): number {
  if (isbn && book.isbn_13 === isbn) return 1000;
  const q = searchText(query);
  const title = searchText(book.title);
  const author = searchText(book.author);
  const subjects = searchText((book.subjects ?? []).join(" "));
  const description = searchText(book.description ?? "");
  let score = 0;
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 80;
  else if (title.includes(q)) score += 60;
  if (author === q) score += 55;
  else if (author.includes(q)) score += 35;
  if (subjects.includes(q)) score += 20;
  if (description.includes(q)) score += 8;
  return score;
}

function fromCatalog(row: CatalogBookRow): SearchResult {
  return {
    resultKey: `catalog:${row.id}`,
    source: "catalog",
    catalogBookId: row.id,
    googleBooksId: row.google_books_id ?? "",
    openLibraryId: row.open_library_id,
    title: row.title,
    author: row.author,
    isbn13: row.isbn_13,
    description: row.description,
    language: null,
    publishedYear: row.published_year,
    pageCount: row.page_count,
    subjects: row.subjects ?? [],
    thumbnail: row.cover_url,
  };
}

function fromGoogle(book: GoogleBook): SearchResult {
  return {
    ...book,
    resultKey: `google:${book.googleBooksId}`,
    source: "google",
    catalogBookId: null,
    openLibraryId: book.openLibraryId ?? null,
  };
}

function fromOpenLibrary(book: OpenLibraryBook): SearchResult {
  return {
    resultKey: `openlibrary:${book.openLibraryId}`,
    source: "openlibrary",
    catalogBookId: null,
    googleBooksId: "",
    openLibraryId: book.openLibraryId,
    title: book.title,
    author: book.author,
    isbn13: book.isbn13,
    description: book.description,
    language: book.language,
    publishedYear: book.publishedYear,
    pageCount: book.pageCount,
    subjects: book.subjects,
    thumbnail: book.thumbnail,
  };
}

function emptyMeta(startedAt: number): Extract<SearchActionResult, { ok: true }>["meta"] {
  return {
    elapsedMs: Date.now() - startedAt,
    partial: false,
    sources: { catalog: 0, google: 0, openlibrary: 0 },
    unavailable: [],
  };
}

function identityKeys(book: SearchResult): string[] {
  return [
    book.catalogBookId ? `catalog:${book.catalogBookId}` : "",
    book.googleBooksId ? `google:${book.googleBooksId}` : "",
    book.openLibraryId ? `openlibrary:${book.openLibraryId}` : "",
    book.isbn13 ? `isbn:${book.isbn13}` : "",
    `${normalizeTitle(book.title)}|${book.author.toLowerCase().trim()}`,
  ].filter(Boolean);
}

function mergeMissingMetadata(target: SearchResult, source: SearchResult) {
  target.googleBooksId ||= source.googleBooksId;
  target.openLibraryId ||= source.openLibraryId;
  target.isbn13 ||= source.isbn13;
  target.description ||= source.description;
  target.language ||= source.language;
  target.publishedYear ||= source.publishedYear;
  target.pageCount ||= source.pageCount;
  target.thumbnail ||= source.thumbnail;
  if (target.subjects.length === 0 && source.subjects.length > 0) target.subjects = source.subjects;
}

function mergeResults(...groups: SearchResult[][]): SearchResult[] {
  const seen = new Set<string>();
  const byKey = new Map<string, SearchResult>();
  const out: SearchResult[] = [];
  for (const book of groups.flat()) {
    const keys = identityKeys(book);
    const existing = keys.map((key) => byKey.get(key)).find(Boolean);
    if (existing) {
      mergeMissingMetadata(existing, book);
      keys.forEach((key) => {
        seen.add(key);
        byKey.set(key, existing);
      });
      continue;
    }
    keys.forEach((key) => seen.add(key));
    keys.forEach((key) => byKey.set(key, book));
    out.push(book);
  }
  return out;
}

async function searchCatalog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  queryText: string,
  limit = 12,
): Promise<SearchResult[]> {
  const isbn = normalizeIsbn(queryText);
  let query = supabase
    .from("books")
    .select("id, google_books_id, open_library_id, isbn_13, title, author, cover_url, description, page_count, published_year, subjects")
    .limit(30);

  if (isbn) {
    query = query.eq("isbn_13", isbn);
  } else {
    if (!searchText(queryText)) return [];
    const pattern = catalogPattern(queryText.trim());
    query = query.or(`title.ilike.${pattern},author.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as CatalogBookRow[])
    .map((book) => ({ book, score: catalogScore(book, queryText, isbn) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => fromCatalog(entry.book));
}

async function loadTasteSignals(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("user_books")
    .select("rating, book:books(author, subjects)")
    .eq("user_id", userId)
    .eq("status", "finished")
    .gte("rating", 4)
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(40);

  const authors = new Set<string>();
  const subjects = new Map<string, number>();

  for (const row of data ?? []) {
    const book = Array.isArray(row.book) ? row.book[0] : row.book;
    const rating = Number(row.rating ?? 4);
    const weight = Math.max(1, rating - 3);
    const author = (book?.author as string | undefined)?.trim().toLowerCase();
    if (author) authors.add(author);
    for (const subject of ((book?.subjects as string[] | null | undefined) ?? []).slice(0, 6)) {
      const key = subject.toLowerCase();
      subjects.set(key, (subjects.get(key) ?? 0) + weight);
    }
  }

  return { authors, subjects };
}

function rankForReader<T extends Pick<GoogleBook, "author" | "subjects">>(books: T[], taste: Awaited<ReturnType<typeof loadTasteSignals>>): T[] {
  if (taste.authors.size === 0 && taste.subjects.size === 0) return books;
  return books
    .map((book, index) => {
      let score = 0;
      if (taste.authors.has(book.author.toLowerCase())) score += 8;
      for (const subject of book.subjects) {
        const s = subject.toLowerCase();
        for (const [liked, weight] of taste.subjects) {
          if (s.includes(liked) || liked.includes(s)) score += weight;
        }
      }
      return { book, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.book);
}

export async function searchAction(query: string): Promise<SearchActionResult> {
  const startedAt = Date.now();
  if (!query.trim()) return { ok: true, books: [], meta: emptyMeta(startedAt) };
  try {
    const providerQuery = isbnSearchQuery(query) ?? query;
    const [supabase, user] = await Promise.all([
      createClient(),
      getCurrentUser(),
    ]);
    const [catalogBooks, googleResult, openLibraryResult] = await Promise.all([
      searchCatalog(supabase, query, 12),
      searchBooks(providerQuery, 18).then(
        (books) => ({ ok: true as const, books }),
        (error) => ({ ok: false as const, error }),
      ),
      searchOpenLibraryBooks(providerQuery, 12).then(
        (books) => ({ ok: true as const, books }),
        () => ({ ok: true as const, books: [] as OpenLibraryBook[] }),
      ),
    ]);
    const unavailable: Array<"google" | "openlibrary" | "catalog"> = [];
    if (!googleResult.ok) unavailable.push("google");
    const rawBooks = googleResult.ok ? googleResult.books : [];
    const openLibraryBooks = openLibraryResult.books;
    const deduped = mergeResults(
      catalogBooks,
      dedupByEdition(rawBooks).map(fromGoogle),
      dedupByEdition(openLibraryBooks).map(fromOpenLibrary),
    );
    if (deduped.length === 0 && !googleResult.ok) throw googleResult.error;
    const taste = user ? await loadTasteSignals(supabase, user.id) : null;
    const books = (taste ? rankForReader(deduped, taste) : deduped).slice(0, 12);
    const meta: Extract<SearchActionResult, { ok: true }>["meta"] = {
      elapsedMs: Date.now() - startedAt,
      partial: unavailable.length > 0,
      sources: {
        catalog: books.filter((book) => book.source === "catalog").length,
        google: books.filter((book) => book.source === "google").length,
        openlibrary: books.filter((book) => book.source === "openlibrary").length,
      },
      unavailable,
    };
    if (!user || books.length === 0) {
      return { ok: true, books: books.map((book) => ({ ...book, shelfStatus: null })), meta };
    }

    const catalogBookIds = [...new Set(books.map((book) => book.catalogBookId).filter(Boolean) as string[])];
    const googleIds = [...new Set(books.map((book) => book.googleBooksId).filter(Boolean) as string[])];
    const openLibraryIds = [...new Set(books.map((book) => book.openLibraryId).filter(Boolean) as string[])];
    const isbn13s = [...new Set(books.map((book) => book.isbn13).filter(Boolean) as string[])];
    const catalogFilters = [
      catalogBookIds.length ? `id.in.(${catalogBookIds.join(",")})` : "",
      googleIds.length ? `google_books_id.in.(${googleIds.join(",")})` : "",
      openLibraryIds.length ? `open_library_id.in.(${openLibraryIds.join(",")})` : "",
      isbn13s.length ? `isbn_13.in.(${isbn13s.join(",")})` : "",
    ].filter(Boolean);
    const { data: catalogRows } = catalogFilters.length
      ? await supabase
          .from("books")
          .select("id, google_books_id, open_library_id, isbn_13")
          .or(catalogFilters.join(","))
      : { data: [] };

    const bookIds = (catalogRows ?? []).map((row) => row.id as string);
    let shelfRows: Array<{ book_id: string; status: string }> = [];
    if (bookIds.length > 0) {
      const { data } = await supabase
        .from("user_books")
        .select("book_id, status")
        .eq("user_id", user.id)
        .in("book_id", bookIds);
      shelfRows = (data ?? []).map((row) => ({
        book_id: row.book_id as string,
        status: row.status as string,
      }));
    }

    return {
      ok: true,
      books: applyShelfStatuses(
        books,
        (catalogRows ?? []).map((row) => ({
          id: row.id as string,
          google_books_id: row.google_books_id as string | null,
          open_library_id: row.open_library_id as string | null,
          isbn_13: row.isbn_13 as string | null,
        })),
        shelfRows,
      ),
      meta,
    };
  } catch (err) {
    if (err instanceof GoogleBooksApiError) {
      if (err.status === 429) return { ok: false, error: "rate-limit", books: [] };
      if (err.status === 408 || err.status === 0) return { ok: false, error: "timeout", books: [] };
      return { ok: false, error: "api", books: [] };
    }
    return { ok: false, error: "unknown", books: [] };
  }
}

export async function addToPile(g: GoogleBook): Promise<
  | { ok: true; userBookId: string; status: "pile" | "reading" | "finished" | "abandoned"; alreadyExisted: boolean }
  | { error: string }
> {
  // Resolve the auth + the catalog lookup in parallel; they don't depend on each other.
  const [supabase, user, existingBookResult] = await Promise.all([
    createClient(),
    getCurrentUser(),
    (async () => {
      const sb = await createClient();
      if (g.catalogBookId) {
        return sb.from("books").select(BOOK_METADATA_SELECT).eq("id", g.catalogBookId).maybeSingle();
      }
      if (g.googleBooksId) {
        const byGoogle = await sb.from("books").select(BOOK_METADATA_SELECT).eq("google_books_id", g.googleBooksId).maybeSingle();
        if (byGoogle.data || byGoogle.error) return byGoogle;
      }
      if (g.openLibraryId) {
        const byOpenLibrary = await sb.from("books").select(BOOK_METADATA_SELECT).eq("open_library_id", g.openLibraryId).maybeSingle();
        if (byOpenLibrary.data || byOpenLibrary.error) return byOpenLibrary;
      }
      if (g.isbn13) {
        return sb.from("books").select(BOOK_METADATA_SELECT).eq("isbn_13", g.isbn13).limit(1).maybeSingle();
      }
      return { data: null, error: null };
    })(),
  ]);
  if (!user) return { error: "Not signed in" };

  let existingBook = existingBookResult.data as ExistingBookRow | null;
  let bookId = existingBook?.id;
  if (!bookId) {
    // Use insert + duplicate fallback instead of Supabase upsert. Production may
    // still have the partial google_books_id index, which cannot satisfy
    // onConflict but still protects this race.
    const { data: inserted, error: insErr } = await supabase
      .from("books")
      .insert({
        google_books_id: g.googleBooksId || null,
        open_library_id: g.openLibraryId ?? null,
        title: g.title,
        author: g.author,
        isbn_13: g.isbn13,
        description: g.description ?? null,
        page_count: g.pageCount,
        published_year: g.publishedYear,
        subjects: g.subjects,
        cover_url: g.thumbnail,
      })
      .select("id")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        if (g.googleBooksId) {
          const { data: racedBook } = await supabase
            .from("books")
            .select(BOOK_METADATA_SELECT)
            .eq("google_books_id", g.googleBooksId)
            .maybeSingle();
          existingBook = racedBook as ExistingBookRow | null;
          bookId = existingBook?.id;
        }
        if (!bookId && g.openLibraryId) {
          const { data: racedBook } = await supabase
            .from("books")
            .select(BOOK_METADATA_SELECT)
            .eq("open_library_id", g.openLibraryId)
            .maybeSingle();
          existingBook = racedBook as ExistingBookRow | null;
          bookId = existingBook?.id;
        }
        if (!bookId && g.isbn13) {
          const { data: racedBook } = await supabase
            .from("books")
            .select(BOOK_METADATA_SELECT)
            .eq("isbn_13", g.isbn13)
            .maybeSingle();
          existingBook = racedBook as ExistingBookRow | null;
          bookId = existingBook?.id;
        }
      }
      if (!bookId) return { error: "Could not save that book. Try again." };
    } else {
      bookId = inserted?.id as string | undefined;
    }

    if (!bookId) return { error: "Could not save that book. Try again." };
  }

  if (existingBook) {
    const patch = missingBookMetadataPatch(existingBook, g);
    if (Object.keys(patch).length > 0) {
      await supabase.from("books").update(patch).eq("id", bookId);
    }
  }

  // Single round-trip: insert user_books, fall back to read on unique-violation.
  const { data: ub, error: ubErr } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status: "pile",
      added_to_pile_at: new Date().toISOString(),
      added_from: "search",
    })
    .select("id, status")
    .single();

  if (ubErr) {
    // unique(user_id, book_id) collision ? the book is already on this user's shelf.
    if (ubErr.code === "23505") {
      const { data: existingUb } = await supabase
        .from("user_books")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (existingUb) {
        return {
          ok: true,
          userBookId: existingUb.id,
          status: existingUb.status,
          alreadyExisted: true,
        };
      }
    }
    return { error: "Could not add that book to your pile. Try again." };
  }

  revalidatePath("/pile");
  revalidatePath("/home");
  return { ok: true, userBookId: ub.id, status: ub.status, alreadyExisted: false };
}

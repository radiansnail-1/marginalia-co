"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { searchBooks, GoogleBooksApiError, type GoogleBook } from "@/lib/books/google-books";
import { applyShelfStatuses, type ShelfTaggedBook } from "./shelf-status";

export type { UserBookStatus } from "./shelf-status";
export type SearchBook = ShelfTaggedBook<GoogleBook>;

export type SearchActionResult =
  | { ok: true; books: SearchBook[] }
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

function rankForReader(books: GoogleBook[], taste: Awaited<ReturnType<typeof loadTasteSignals>>): GoogleBook[] {
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
  if (!query.trim()) return { ok: true, books: [] };
  try {
    const [rawBooks, supabase, user] = await Promise.all([
      searchBooks(query, 18),
      createClient(),
      getCurrentUser(),
    ]);
    const deduped = dedupByEdition(rawBooks);
    const taste = user ? await loadTasteSignals(supabase, user.id) : null;
    const books = (taste ? rankForReader(deduped, taste) : deduped).slice(0, 12);
    if (!user || books.length === 0) {
      return { ok: true, books: books.map((book) => ({ ...book, shelfStatus: null })) };
    }

    const googleIds = [...new Set(books.map((book) => book.googleBooksId))];
    const { data: catalogRows } = await supabase
      .from("books")
      .select("id, google_books_id")
      .in("google_books_id", googleIds);

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
        })),
        shelfRows,
      ),
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
      return sb
        .from("books")
        .select("id")
        .eq("google_books_id", g.googleBooksId)
        .maybeSingle();
    })(),
  ]);
  if (!user) return { error: "Not signed in" };

  let bookId = (existingBookResult.data?.id as string | undefined);
  if (!bookId) {
    // Use insert + duplicate fallback instead of Supabase upsert. Production may
    // still have the partial google_books_id index, which cannot satisfy
    // onConflict but still protects this race.
    const { data: inserted, error: insErr } = await supabase
      .from("books")
      .insert({
        google_books_id: g.googleBooksId,
        title: g.title,
        author: g.author,
        isbn_13: g.isbn13,
        page_count: g.pageCount,
        published_year: g.publishedYear,
        subjects: g.subjects,
        cover_url: g.thumbnail,
      })
      .select("id")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        const { data: racedBook } = await supabase
          .from("books")
          .select("id")
          .eq("google_books_id", g.googleBooksId)
          .maybeSingle();
        bookId = racedBook?.id as string | undefined;
      }
      if (!bookId) return { error: "Could not save that book. Try again." };
    } else {
      bookId = inserted?.id as string | undefined;
    }

    if (!bookId) return { error: "Could not save that book. Try again." };
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

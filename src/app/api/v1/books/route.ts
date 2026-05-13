import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, jsonError } from "@/lib/api/auth";
import { ApiTimer, withServerTiming } from "@/lib/api/timing";
import { createServiceClient } from "@/lib/supabase/service";
import { searchBooks } from "@/lib/books/google-books";

export const runtime = "nodejs";

const StatusEnum = z.enum(["pile", "reading", "finished", "abandoned"]);

const BookInputSchema = z.object({
  googleBooksId: z.string().optional(),
  isbn13: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  description: z.string().max(4000).optional(),
  subjects: z.array(z.string()).max(20).optional(),
  status: StatusEnum.default("pile"),
  rating: z.number().min(0.5).max(5).refine((n) => Number.isInteger(n * 2), "Rating must be in 0.5 increments.").optional(),
  review: z.string().max(4000).optional(),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().optional(),
  coverUrl: z.string().url().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

type BookInput = z.infer<typeof BookInputSchema>;

type ResolvedBookMetadata = {
  googleBooksId: string | null;
  isbn13: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publishedYear: number | null;
  subjects: string[];
  description: string | null;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function authorMatches(expected: string, candidate: string) {
  const a = normalize(expected);
  const b = normalize(candidate);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const last = a.split(" ").at(-1);
  return !!last && b.split(" ").includes(last);
}

function titleMatches(expected: string, candidate: string) {
  const a = normalize(expected);
  const b = normalize(candidate);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

async function resolveBookMetadata(input: BookInput): Promise<ResolvedBookMetadata> {
  const base: ResolvedBookMetadata = {
    googleBooksId: input.googleBooksId ?? null,
    isbn13: input.isbn13 ?? null,
    coverUrl: input.coverUrl ?? null,
    pageCount: input.pageCount ?? null,
    publishedYear: input.publishedYear ?? null,
    subjects: input.subjects ?? [],
    description: input.description?.trim().slice(0, 4000) || null,
  };

  if (base.googleBooksId && base.isbn13 && base.coverUrl && base.pageCount && base.publishedYear && base.subjects.length > 0) {
    return base;
  }

  try {
    const candidates = await searchBooks(`${input.title} ${input.author}`, 6);
    const scored = candidates
      .map((book) => {
        let score = 0;
        if (titleMatches(input.title, book.title)) score += 55;
        if (authorMatches(input.author, book.author)) score += 35;
        if (book.isbn13 && book.isbn13 === input.isbn13) score += 80;
        if (book.thumbnail) score += 5;
        return { book, score };
      })
      .sort((a, b) => b.score - a.score);
    const match = scored.find((entry) => entry.score >= 70)?.book ?? scored[0]?.book;
    if (!match) return base;
    return {
      googleBooksId: base.googleBooksId ?? match.googleBooksId,
      isbn13: base.isbn13 ?? match.isbn13,
      coverUrl: base.coverUrl ?? match.thumbnail,
      pageCount: base.pageCount ?? match.pageCount,
      publishedYear: base.publishedYear ?? match.publishedYear,
      subjects: base.subjects.length ? base.subjects : match.subjects,
      description: base.description ?? match.description ?? null,
    };
  } catch {
    return base;
  }
}

async function lookupExistingBook(
  supabase: ReturnType<typeof createServiceClient>,
  input: BookInput,
  metadata: ResolvedBookMetadata,
  timer: ApiTimer,
) {
  if (metadata.googleBooksId) {
    const { data } = await timer.measure("db.book_google", () =>
      supabase.from("books").select("id").eq("google_books_id", metadata.googleBooksId).maybeSingle(),
    );
    if (data?.id) return data;
  }

  if (metadata.isbn13) {
    const { data } = await timer.measure("db.book_isbn", () =>
      supabase.from("books").select("id").eq("isbn_13", metadata.isbn13).limit(1).maybeSingle(),
    );
    if (data?.id) return data;
  }

  const { data } = await timer.measure("db.book_title_author", () =>
    supabase
      .from("books")
      .select("id, google_books_id, isbn_13, cover_url, page_count, published_year, subjects, description")
      .ilike("title", input.title.trim())
      .ilike("author", input.author.trim())
      .order("added_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  );
  return data ?? null;
}

async function patchMissingBookMetadata(
  supabase: ReturnType<typeof createServiceClient>,
  bookId: string,
  existing: Record<string, unknown>,
  metadata: ResolvedBookMetadata,
  timer: ApiTimer,
) {
  const patch: Record<string, unknown> = {};
  if (!existing.google_books_id && metadata.googleBooksId) patch.google_books_id = metadata.googleBooksId;
  if (!existing.isbn_13 && metadata.isbn13) patch.isbn_13 = metadata.isbn13;
  if (!existing.cover_url && metadata.coverUrl) patch.cover_url = metadata.coverUrl;
  if (!existing.page_count && metadata.pageCount) patch.page_count = metadata.pageCount;
  if (!existing.published_year && metadata.publishedYear) patch.published_year = metadata.publishedYear;
  if ((!Array.isArray(existing.subjects) || existing.subjects.length === 0) && metadata.subjects.length) patch.subjects = metadata.subjects;
  if (!existing.description && metadata.description) {
    patch.description = metadata.description;
    patch.embedding = null;
    patch.embedding_model = null;
    patch.embedding_dimensions = null;
    patch.embedding_text_hash = null;
    patch.embedded_at = null;
  }
  if (Object.keys(patch).length === 0) return;
  await timer.measure("db.book_metadata_patch", () =>
    supabase.from("books").update(patch).eq("id", bookId),
  );
}

export async function GET(req: NextRequest) {
  const timer = new ApiTimer();
  const auth = await authenticate(req, timer);
  if (auth instanceof NextResponse) return withServerTiming(auth, timer);
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const supabase = createServiceClient();

  let query = supabase
    .from("user_books")
    .select("id, status, rating, review, started_at, finished_at, added_to_pile_at, book:books(id, google_books_id, isbn_13, title, author, cover_url, page_count, published_year, subjects, average_rating, rating_count)")
    .eq("user_id", auth.userId)
    .order("added_to_pile_at", { ascending: false })
    .limit(200);
  if (status && StatusEnum.safeParse(status).success) {
    query = query.eq("status", status);
  }
  const { data, error } = await timer.measure("db.books", () => query);
  if (error) return withServerTiming(jsonError(500, error.message), timer);

  return withServerTiming(NextResponse.json({
    books: (data ?? []).map((row) => {
      const b = Array.isArray(row.book) ? row.book[0] : row.book;
      return {
        user_book_id: row.id,
        status: row.status,
        rating: row.rating,
        review: row.review,
        started_at: row.started_at,
        finished_at: row.finished_at,
        added_to_pile_at: row.added_to_pile_at,
        book_id: b?.id,
        google_books_id: b?.google_books_id,
        isbn13: b?.isbn_13,
        title: b?.title,
        author: b?.author,
        cover_url: b?.cover_url,
        page_count: b?.page_count,
        published_year: b?.published_year,
        subjects: b?.subjects ?? [],
        average_rating: b?.average_rating,
        rating_count: b?.rating_count ?? 0,
      };
    }),
  }), timer);
}

export async function POST(req: NextRequest) {
  const timer = new ApiTimer();
  const auth = await authenticate(req, timer);
  if (auth instanceof NextResponse) return withServerTiming(auth, timer);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Request body must be JSON.");
  }
  const parsed = BookInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.message);
  }
  const input = parsed.data;
  const supabase = createServiceClient();
  const metadata = await timer.measure("external.book_metadata", () => resolveBookMetadata(input));

  let bookId: string | undefined;
  const existingBook = await lookupExistingBook(supabase, input, metadata, timer);
  bookId = existingBook?.id as string | undefined;
  if (bookId && existingBook) await patchMissingBookMetadata(supabase, bookId, existingBook, metadata, timer);

  if (!bookId) {
    const { data: inserted, error: insErr } = await timer.measure("db.book_insert", () =>
      supabase
        .from("books")
        .insert({
          google_books_id: metadata.googleBooksId,
          isbn_13: metadata.isbn13,
          title: input.title,
          author: input.author,
          description: metadata.description,
          subjects: metadata.subjects,
          page_count: metadata.pageCount,
          published_year: metadata.publishedYear,
          cover_url: metadata.coverUrl,
        })
        .select("id")
        .single(),
    );
    if (insErr || !inserted) {
      return withServerTiming(jsonError(500, insErr?.message ?? "Could not save book."), timer);
    }
    bookId = inserted.id;
  }

  const { data: existing } = await timer.measure("db.user_book_lookup", () =>
    supabase
      .from("user_books")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("book_id", bookId)
      .maybeSingle(),
  );

  const payload = {
    user_id: auth.userId,
    book_id: bookId,
    status: input.status,
    rating: input.rating ?? null,
    review: input.review ? input.review.trim().slice(0, 4000) || null : null,
    started_at: input.startedAt ?? (input.status === "reading" || input.status === "finished" ? new Date().toISOString() : null),
    finished_at: input.finishedAt ?? (input.status === "finished" ? new Date().toISOString() : null),
    added_to_pile_at: existing ? undefined : new Date().toISOString(),
    added_from: "api",
  };

  if (existing) {
    const { error: updErr } = await timer.measure("db.user_book_update", () =>
      supabase
        .from("user_books")
        .update(payload)
        .eq("id", existing.id),
    );
    if (updErr) return withServerTiming(jsonError(500, updErr.message), timer);
    return withServerTiming(NextResponse.json({ user_book_id: existing.id, book_id: bookId, updated: true }), timer);
  }

  const { data: created, error: insErr } = await timer.measure("db.user_book_insert", () =>
    supabase
      .from("user_books")
      .insert(payload)
      .select("id")
      .single(),
  );
  if (insErr || !created) {
    return withServerTiming(jsonError(500, insErr?.message ?? "Could not link book to your shelf."), timer);
  }

  return withServerTiming(NextResponse.json({ user_book_id: created.id, book_id: bookId, created: true }, { status: 201 }), timer);
}

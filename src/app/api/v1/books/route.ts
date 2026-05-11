import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, jsonError } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { searchBooks } from "@/lib/books/google-books";

export const runtime = "nodejs";

const StatusEnum = z.enum(["pile", "reading", "finished", "abandoned"]);

const BookInputSchema = z.object({
  googleBooksId: z.string().optional(),
  isbn13: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  status: StatusEnum.default("pile"),
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(4000).optional(),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().optional(),
  coverUrl: z.string().url().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth instanceof NextResponse) return auth;
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
  const { data, error } = await query;
  if (error) return jsonError(500, error.message);

  return NextResponse.json({
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
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth instanceof NextResponse) return auth;

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

  // Resolve the shared books row. Prefer googleBooksId, fall back to isbn13, then (title, author).
  let bookId: string | undefined;
  if (input.googleBooksId) {
    const { data } = await supabase.from("books").select("id").eq("google_books_id", input.googleBooksId).maybeSingle();
    bookId = data?.id;
  }
  if (!bookId && input.isbn13) {
    const { data } = await supabase.from("books").select("id").eq("isbn_13", input.isbn13).maybeSingle();
    bookId = data?.id;
  }
  if (!bookId) {
    // Cover fallback: if the caller didn't provide one, try Google Books by
    // title+author so API-added books still get a thumbnail. Best-effort; on
    // failure we just store the book without a cover.
    let resolvedCover = input.coverUrl ?? null;
    let resolvedGoogleId = input.googleBooksId ?? null;
    let resolvedIsbn = input.isbn13 ?? null;
    let resolvedPages = input.pageCount ?? null;
    let resolvedYear = input.publishedYear ?? null;
    if (!resolvedCover) {
      try {
        const candidates = await searchBooks(`${input.title} ${input.author}`, 3);
        const match = candidates[0];
        if (match) {
          resolvedCover = match.thumbnail ?? null;
          if (!resolvedGoogleId) resolvedGoogleId = match.googleBooksId;
          if (!resolvedIsbn) resolvedIsbn = match.isbn13;
          if (!resolvedPages) resolvedPages = match.pageCount;
          if (!resolvedYear) resolvedYear = match.publishedYear;
        }
      } catch {
        // ignore — keep cover null
      }
    }

    const { data: inserted, error: insErr } = await supabase
      .from("books")
      .insert({
        google_books_id: resolvedGoogleId,
        isbn_13: resolvedIsbn,
        title: input.title,
        author: input.author,
        page_count: resolvedPages,
        published_year: resolvedYear,
        cover_url: resolvedCover,
      })
      .select("id")
      .single();
    if (insErr || !inserted) return jsonError(500, insErr?.message ?? "Could not save book.");
    bookId = inserted.id;
  }

  const { data: existing } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("book_id", bookId)
    .maybeSingle();

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
    const { error: updErr } = await supabase
      .from("user_books")
      .update(payload)
      .eq("id", existing.id);
    if (updErr) return jsonError(500, updErr.message);
    return NextResponse.json({ user_book_id: existing.id, book_id: bookId, updated: true });
  }

  const { data: created, error: insErr } = await supabase
    .from("user_books")
    .insert(payload)
    .select("id")
    .single();
  if (insErr || !created) return jsonError(500, insErr?.message ?? "Could not link book to your shelf.");

  return NextResponse.json({ user_book_id: created.id, book_id: bookId, created: true }, { status: 201 });
}

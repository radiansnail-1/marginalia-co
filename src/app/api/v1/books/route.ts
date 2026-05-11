import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, jsonError } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const StatusEnum = z.enum(["pile", "reading", "finished", "abandoned"]);

const BookInputSchema = z.object({
  googleBooksId: z.string().optional(),
  isbn13: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  status: StatusEnum.default("pile"),
  rating: z.number().int().min(1).max(5).optional(),
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
    .select("id, status, rating, started_at, finished_at, added_to_pile_at, book:books(id, google_books_id, isbn_13, title, author, cover_url, page_count, published_year, subjects)")
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
    const { data: inserted, error: insErr } = await supabase
      .from("books")
      .insert({
        google_books_id: input.googleBooksId ?? null,
        isbn_13: input.isbn13 ?? null,
        title: input.title,
        author: input.author,
        page_count: input.pageCount ?? null,
        published_year: input.publishedYear ?? null,
        cover_url: input.coverUrl ?? null,
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

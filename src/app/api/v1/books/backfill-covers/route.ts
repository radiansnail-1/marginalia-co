import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { searchBooks } from "@/lib/books/google-books";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/v1/books/backfill-covers
// For the authenticated user, find every book on their shelf with no
// cover_url and try to fill one in by querying Google Books. Returns a
// per-book report. Cheap: capped at 80 books per call, ~120ms each.
export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from("user_books")
    .select("book:books(id, title, author, cover_url, google_books_id, isbn_13)")
    .eq("user_id", auth.userId)
    .limit(200);
  if (error) return jsonError(500, error.message);

  type B = { id: string; title: string; author: string; cover_url: string | null; google_books_id: string | null; isbn_13: string | null };
  const books: B[] = (rows ?? [])
    .map((r) => (Array.isArray(r.book) ? r.book[0] : r.book) as B | null)
    .filter((b): b is B => !!b && !b.cover_url);

  // Dedup by book id (multiple user_books rows can point at the same book).
  const seen = new Set<string>();
  const unique = books.filter((b) => { if (seen.has(b.id)) return false; seen.add(b.id); return true; }).slice(0, 80);

  const report: Array<{ id: string; title: string; updated: boolean; reason?: string }> = [];

  for (const b of unique) {
    try {
      const candidates = await searchBooks(`${b.title} ${b.author}`, 3);
      const match = candidates[0];
      if (!match || !match.thumbnail) {
        report.push({ id: b.id, title: b.title, updated: false, reason: "no match" });
        continue;
      }
      const patch: Record<string, unknown> = { cover_url: match.thumbnail };
      if (!b.google_books_id) patch.google_books_id = match.googleBooksId;
      if (!b.isbn_13 && match.isbn13) patch.isbn_13 = match.isbn13;
      const { error: updErr } = await supabase.from("books").update(patch).eq("id", b.id);
      if (updErr) {
        report.push({ id: b.id, title: b.title, updated: false, reason: updErr.message });
      } else {
        report.push({ id: b.id, title: b.title, updated: true });
      }
    } catch (e) {
      report.push({ id: b.id, title: b.title, updated: false, reason: (e as Error).message });
    }
  }

  return NextResponse.json({
    scanned: unique.length,
    updated: report.filter((r) => r.updated).length,
    report,
  });
}

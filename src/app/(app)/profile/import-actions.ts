"use server";

import { revalidatePath } from "next/cache";
import { parseGoodreadsCsv, type GoodreadsImportRow } from "@/lib/books/goodreads-import";
import { searchBooks, type GoogleBook } from "@/lib/books/google-books";
import { isbnSearchQuery } from "@/lib/books/isbn";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

const GOODREADS_IMPORT_LIMIT = 2000;

export async function previewGoodreadsImport(text: string) {
  const parsed = parseGoodreadsCsv(text);
  const skippedOverLimit = Math.max(0, parsed.rows.length - GOODREADS_IMPORT_LIMIT);
  return {
    ok: true as const,
    total: parsed.rows.length,
    importable: Math.min(parsed.rows.length, GOODREADS_IMPORT_LIMIT),
    skipped: parsed.skipped,
    skippedOverLimit,
    counts: parsed.counts,
  };
}

export async function commitGoodreadsImport(text: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };

  const parsed = parseGoodreadsCsv(text);
  let created = 0;
  let updated = 0;
  const rowsToImport = parsed.rows.slice(0, GOODREADS_IMPORT_LIMIT);
  const skippedOverLimit = Math.max(0, parsed.rows.length - GOODREADS_IMPORT_LIMIT);
  let skipped = parsed.skipped + skippedOverLimit;

  for (const row of rowsToImport) {
    const bookId = await resolveBookId(supabase, row);
    if (!bookId) {
      skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      book_id: bookId,
      status: row.status,
      rating: row.rating,
      started_at: row.startedAt,
      finished_at: row.status === "finished" ? row.finishedAt : null,
      added_to_pile_at: row.status === "pile" ? new Date().toISOString() : null,
      added_from: "goodreads import",
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("user_books")
        .update(payload)
        .eq("id", existing.id);
      if (error) skipped++;
      else updated++;
    } else {
      const { error } = await supabase.from("user_books").insert(payload);
      if (error) skipped++;
      else created++;
    }
  }

  revalidatePath("/pile");
  revalidatePath("/shelf");
  revalidatePath("/reading");
  revalidatePath("/profile");

  return {
    ok: true as const,
    total: parsed.rows.length,
    importable: rowsToImport.length,
    created,
    updated,
    skipped,
    skippedOverLimit,
  };
}

async function resolveBookId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: GoodreadsImportRow,
): Promise<string | null> {
  if (row.isbn13) {
    const { data } = await supabase
      .from("books")
      .select("id")
      .eq("isbn_13", row.isbn13)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data: titleMatch } = await supabase
    .from("books")
    .select("id")
    .eq("title", row.title)
    .eq("author", row.author)
    .maybeSingle();
  if (titleMatch?.id) return titleMatch.id as string;

  const metadata = await resolveGoogleMetadata(row);
  const { data: inserted, error } = await supabase
    .from("books")
    .insert({
      google_books_id: metadata?.googleBooksId ?? null,
      isbn_13: metadata?.isbn13 ?? row.isbn13,
      title: metadata?.title ?? row.title,
      author: metadata?.author ?? row.author,
      description: metadata?.description ?? null,
      page_count: metadata?.pageCount ?? null,
      published_year: metadata?.publishedYear ?? null,
      subjects: metadata?.subjects?.length ? metadata.subjects : ["goodreads import"],
      cover_url: metadata?.thumbnail ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const duplicate = await findExistingBookId(supabase, metadata, row);
      if (duplicate) return duplicate;
    }
    return null;
  }
  return inserted?.id as string | null;
}

async function resolveGoogleMetadata(row: GoodreadsImportRow): Promise<GoogleBook | null> {
  const queries = [
    row.isbn13 ? isbnSearchQuery(row.isbn13) : null,
    `${row.title} ${row.author}`,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    try {
      const books = await searchBooks(query, 5);
      const exactIsbn = row.isbn13 ? books.find((book) => book.isbn13 === row.isbn13) : null;
      const titleAuthor = books.find(
        (book) =>
          book.title.trim().toLowerCase() === row.title.trim().toLowerCase() &&
          book.author.trim().toLowerCase() === row.author.trim().toLowerCase(),
      );
      const match = exactIsbn ?? titleAuthor ?? books[0] ?? null;
      if (match) return match;
    } catch {
      // Imports should keep going when Google metadata is unavailable.
    }
  }

  return null;
}

async function findExistingBookId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  metadata: GoogleBook | null,
  row: GoodreadsImportRow,
): Promise<string | null> {
  if (metadata?.googleBooksId) {
    const { data } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", metadata.googleBooksId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const isbn = metadata?.isbn13 ?? row.isbn13;
  if (isbn) {
    const { data } = await supabase
      .from("books")
      .select("id")
      .eq("isbn_13", isbn)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  return null;
}

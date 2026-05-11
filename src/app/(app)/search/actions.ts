"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { searchBooks, GoogleBooksApiError, type GoogleBook } from "@/lib/books/google-books";

export type SearchActionResult =
  | { ok: true; books: GoogleBook[] }
  | { ok: false; error: "api" | "rate-limit" | "timeout" | "unknown"; books: [] };

export async function searchAction(query: string): Promise<SearchActionResult> {
  if (!query.trim()) return { ok: true, books: [] };
  try {
    const books = await searchBooks(query, 12);
    return { ok: true, books };
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
    // Upsert by google_books_id (unique index, migration 0005). Conflict path
    // returns the existing row so we never lose a race with a parallel add.
    const { data: inserted, error: insErr } = await supabase
      .from("books")
      .upsert(
        {
          google_books_id: g.googleBooksId,
          title: g.title,
          author: g.author,
          isbn_13: g.isbn13,
          page_count: g.pageCount,
          published_year: g.publishedYear,
          subjects: g.subjects,
          cover_url: g.thumbnail,
        },
        { onConflict: "google_books_id", ignoreDuplicates: false },
      )
      .select("id")
      .single();
    if (insErr || !inserted) return { error: insErr?.message ?? "Could not save book" };
    bookId = inserted.id;
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
    // unique(user_id, book_id) collision — the book is already on this user's shelf.
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
    return { error: ubErr.message };
  }

  revalidatePath("/pile");
  revalidatePath("/home");
  return { ok: true, userBookId: ub.id, status: ub.status, alreadyExisted: false };
}

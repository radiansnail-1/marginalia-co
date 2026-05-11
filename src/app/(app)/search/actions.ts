"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchBooks, GoogleBooksApiError, type GoogleBook } from "@/lib/books/google-books";

export type SearchActionResult =
  | { ok: true; books: GoogleBook[] }
  | { ok: false; error: "api" | "rate-limit" | "unknown"; books: [] };

export async function searchAction(query: string): Promise<SearchActionResult> {
  if (!query.trim()) return { ok: true, books: [] };
  try {
    const books = await searchBooks(query, 12);
    return { ok: true, books };
  } catch (err) {
    if (err instanceof GoogleBooksApiError) {
      if (err.status === 429) return { ok: false, error: "rate-limit", books: [] };
      return { ok: false, error: "api", books: [] };
    }
    return { ok: false, error: "unknown", books: [] };
  }
}

export async function addToPile(g: GoogleBook): Promise<
  | { ok: true; userBookId: string; status: "pile" | "reading" | "finished" | "abandoned"; alreadyExisted: boolean }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Upsert into shared books catalog by google_books_id.
  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", g.googleBooksId)
    .maybeSingle();

  let bookId = existingBook?.id as string | undefined;
  if (!bookId) {
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
    if (insErr || !inserted) return { error: insErr?.message ?? "Could not save book" };
    bookId = inserted.id;
  }

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
  if (ubErr || !ub) return { error: ubErr?.message ?? "Could not add to pile" };

  revalidatePath("/pile");
  revalidatePath("/home");
  return { ok: true, userBookId: ub.id, status: ub.status, alreadyExisted: false };
}

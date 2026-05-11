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

export async function searchAction(query: string): Promise<SearchActionResult> {
  if (!query.trim()) return { ok: true, books: [] };
  try {
    const [books, supabase, user] = await Promise.all([
      searchBooks(query, 12),
      createClient(),
      getCurrentUser(),
    ]);
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

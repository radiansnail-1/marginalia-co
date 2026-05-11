"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export async function addBookToPile(bookId: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };
  const { data: existing } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();
  if (existing) return { ok: true, alreadyExisted: true };
  await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    status: "pile",
    added_to_pile_at: new Date().toISOString(),
    added_from: "book detail",
  });
  revalidatePath("/pile");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

export async function startReadingBook(bookId: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("user_books")
      .update({ status: "reading", started_at: now })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_books").insert({
      user_id: user.id,
      book_id: bookId,
      status: "reading",
      started_at: now,
      added_to_pile_at: now,
    });
  }
  revalidatePath("/reading");
  revalidatePath("/home");
  revalidatePath("/pile");
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

export async function rereadBook(bookId: string) {
  return startReadingBook(bookId);
}

export async function saveReview(
  userBookId: string,
  rating: number | null,
  review: string | null,
) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };

  const { data: ub } = await supabase
    .from("user_books")
    .select("id, user_id, book_id")
    .eq("id", userBookId)
    .maybeSingle();
  if (!ub || ub.user_id !== user.id) return { error: "Not found" };

  const patch: Record<string, unknown> = {};
  if (rating === null) patch.rating = null;
  else if (rating >= 1 && rating <= 5) patch.rating = rating;

  if (review === null) patch.review = null;
  else {
    const trimmed = review.trim();
    patch.review = trimmed.length > 0 ? trimmed.slice(0, 4000) : null;
  }

  await supabase.from("user_books").update(patch).eq("id", ub.id);
  revalidatePath(`/books/${ub.book_id}`);
  return { ok: true };
}

export async function removeFromPile(userBookId: string) {
  const supabase = await createClient();
  await supabase.from("user_books").delete().eq("id", userBookId);
  revalidatePath("/pile");
  return { ok: true };
}

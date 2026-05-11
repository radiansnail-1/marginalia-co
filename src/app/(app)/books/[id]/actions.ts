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

export async function removeFromPile(userBookId: string) {
  const supabase = await createClient();
  await supabase.from("user_books").delete().eq("id", userBookId);
  revalidatePath("/pile");
  return { ok: true };
}

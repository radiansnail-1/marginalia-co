"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export async function startSession(userBookId: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };

  // Verify ownership.
  const { data: ub } = await supabase
    .from("user_books")
    .select("id, user_id, started_at, status")
    .eq("id", userBookId)
    .maybeSingle();
  if (!ub || ub.user_id !== user.id) return { error: "Not found" };

  const now = new Date().toISOString();

  // Promote pile -> reading if needed; stamp started_at if blank.
  const patch: Record<string, unknown> = {};
  if (ub.status !== "reading") patch.status = "reading";
  if (!ub.started_at) patch.started_at = now;
  if (Object.keys(patch).length > 0) {
    await supabase.from("user_books").update(patch).eq("id", userBookId);
  }

  const { data: session, error } = await supabase
    .from("reading_sessions")
    .insert({ user_book_id: userBookId, started_at: now })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/reading");
  return { sessionId: session.id };
}

export async function endSession(sessionId: string, shouldRevalidate = true) {
  const supabase = await createClient();
  const now = new Date();
  const { data: session } = await supabase
    .from("reading_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Session not found" };
  const startedAt = new Date(session.started_at);
  const durationSeconds = Math.max(
    0,
    Math.round((now.getTime() - startedAt.getTime()) / 1000),
  );
  await supabase
    .from("reading_sessions")
    .update({ ended_at: now.toISOString(), duration_seconds: durationSeconds })
    .eq("id", sessionId);
  if (shouldRevalidate) revalidatePath("/reading");
  return { durationSeconds };
}

export async function finishBook(
  userBookId: string,
  pages: number | null,
  rating: number | null,
  review: string | null = null,
) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };

  const { data: ub } = await supabase
    .from("user_books")
    .select("id, user_id, book_id")
    .eq("id", userBookId)
    .maybeSingle();
  if (!ub || ub.user_id !== user.id) return { error: "Not found" };

  // Close any open session.
  const { data: openSession } = await supabase
    .from("reading_sessions")
    .select("id")
    .eq("user_book_id", userBookId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (openSession) await endSession(openSession.id, false);

  const patch: Record<string, unknown> = {
    status: "finished",
    finished_at: new Date().toISOString(),
  };
  if (rating && rating >= 1 && rating <= 5) patch.rating = rating;
  if (pages && pages > 0) patch.current_page = pages;
  if (review !== null) {
    const trimmed = review.trim();
    patch.review = trimmed.length > 0 ? trimmed.slice(0, 4000) : null;
  }
  await supabase.from("user_books").update(patch).eq("id", userBookId);

  if (pages && pages > 0) {
    await supabase
      .from("books")
      .update({ page_count: pages })
      .eq("id", ub.book_id)
      .is("page_count", null);
  }

  revalidatePath("/home");
  revalidatePath("/shelf");
  return { ok: true };
}

export async function abandonBook(userBookId: string) {
  const supabase = await createClient();
  await supabase
    .from("user_books")
    .update({ status: "abandoned" })
    .eq("id", userBookId);
  revalidatePath("/reading");
  revalidatePath("/pile");
  return { ok: true };
}

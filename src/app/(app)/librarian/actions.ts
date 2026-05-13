"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { recommend, MOODS, type Mood, type Recommendation, type RecommendResult } from "@/lib/librarian/recommend";

export async function askLibrarian(mood: string): Promise<RecommendResult | { error: string }> {
  if (!MOODS.includes(mood as Mood)) return { error: "Pick a mood from the list." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const result = await recommend({ mood: mood as Mood, userId: user.id });
  await logRecommendationEvents(
    user.id,
    "shown",
    result.picks.map((pick, index) => ({
      bookId: pick.bookId,
      mood,
      rank: pick.rank ?? index + 1,
      source: result.source,
    })),
  );
  return result;
}

export async function saveLibrarianPick(
  pick: Recommendation,
  mood: string | null,
): Promise<{ ok: true; alreadyExisted: boolean; status: string } | { error: string }> {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };
  const bookId = await ensureBookForPick(supabase, pick);
  if (!bookId) return { error: "Could not save that book. Try again." };

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status: "pile",
      added_to_pile_at: now,
      added_from: "librarian",
    })
    .select("id, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("user_books")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (existing) {
        await logRecommendationEvent(user.id, "save", {
          bookId,
          mood,
          rank: pick.rank,
          source: "librarian",
        });
        return { ok: true, alreadyExisted: true, status: existing.status as string };
      }
    }
    return { error: "Could not save that book. Try again." };
  }

  await logRecommendationEvent(user.id, "save", {
    bookId,
    mood,
    rank: pick.rank,
    source: "librarian",
  });
  revalidatePath("/pile");
  revalidatePath("/home");
  return { ok: true, alreadyExisted: false, status: inserted.status as string };
}

export async function markLibrarianNotForMe(
  pick: Recommendation,
  mood: string | null,
): Promise<{ ok: true } | { error: string }> {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };
  const bookId = await ensureBookForPick(supabase, pick);
  await logRecommendationEvent(user.id, "not_for_me", {
    bookId: bookId ?? pick.bookId,
    mood,
    rank: pick.rank,
    source: "librarian",
  });
  return { ok: true };
}

export async function logLibrarianOpen(
  pick: Recommendation,
  mood: string | null,
): Promise<{ ok: true; bookId: string | null } | { error: string }> {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };
  const bookId = await ensureBookForPick(supabase, pick);
  await logRecommendationEvent(user.id, "open", {
    bookId: bookId ?? pick.bookId,
    mood,
    rank: pick.rank,
    source: "librarian",
  });
  return { ok: true, bookId: bookId ?? pick.bookId ?? null };
}

async function ensureBookForPick(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pick: Recommendation,
): Promise<string | null> {
  if (pick.bookId) return pick.bookId;

  if (pick.googleBooksId) {
    const { data } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", pick.googleBooksId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data: titleMatch } = await supabase
    .from("books")
    .select("id")
    .eq("title", pick.title)
    .eq("author", pick.author)
    .maybeSingle();
  if (titleMatch?.id) return titleMatch.id as string;

  const { data: inserted, error } = await supabase
    .from("books")
    .insert({
      google_books_id: pick.googleBooksId ?? null,
      isbn_13: pick.isbn13 ?? null,
      title: pick.title,
      author: pick.author,
      page_count: pick.pageCount ?? null,
      published_year: pick.publishedYear ?? null,
      subjects: pick.subjects ?? [],
      cover_url: pick.coverUrl ?? null,
    })
    .select("id")
    .single();
  if (error) return null;
  return inserted?.id as string | null;
}

async function logRecommendationEvent(
  userId: string,
  eventType: "shown" | "save" | "not_for_me" | "open",
  input: { bookId?: string | null; mood?: string | null; rank?: number | null; source?: string | null },
) {
  if (!input.bookId) return;
  try {
    const supabase = await createClient();
    await supabase.from("recommendation_events").insert({
      user_id: userId,
      book_id: input.bookId,
      event_type: eventType,
      mood: input.mood,
      rank: input.rank,
      source: input.source,
    });
  } catch {
    // Learning events should never block the recommendation flow.
  }
}

async function logRecommendationEvents(
  userId: string,
  eventType: "shown" | "save" | "not_for_me" | "open",
  inputs: Array<{ bookId?: string | null; mood?: string | null; rank?: number | null; source?: string | null }>,
) {
  const rows = inputs.flatMap((input) => {
    if (!input.bookId) return [];
    return [{
      user_id: userId,
      book_id: input.bookId,
      event_type: eventType,
      mood: input.mood,
      rank: input.rank,
      source: input.source,
    }];
  });
  if (rows.length === 0) return;
  try {
    const supabase = await createClient();
    await supabase.from("recommendation_events").insert(rows);
  } catch {
    // Learning events should never block the recommendation flow.
  }
}

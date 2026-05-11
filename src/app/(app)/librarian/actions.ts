"use server";

import { getCurrentUser } from "@/lib/supabase/user";
import { recommend, MOODS, type Mood, type RecommendResult } from "@/lib/librarian/recommend";

export async function askLibrarian(mood: string): Promise<RecommendResult | { error: string }> {
  if (!MOODS.includes(mood as Mood)) return { error: "Pick a mood from the list." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  return recommend({ mood: mood as Mood, userId: user.id });
}

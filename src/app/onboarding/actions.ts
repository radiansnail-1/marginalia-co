"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  claimIncomingReferral,
  qualifyReferralForUser,
} from "@/lib/growth/referral-server";
import { claimSavedPermanentPromoForUser } from "@/lib/growth/promotions-server";
import {
  cleanOnboardingAnswers,
  type OnboardingAnswers,
} from "@/lib/growth/onboarding";

export type { OnboardingAnswers };

async function requireOnboardingUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in first.");
  return user;
}

export async function markPlusPromptSeen() {
  const user = await requireOnboardingUser();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ plus_prompt_seen_at: new Date().toISOString() })
    .eq("id", user.id);
  return { ok: true };
}

export async function markReferralPromptSeen() {
  const user = await requireOnboardingUser();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ referral_prompt_seen_at: new Date().toISOString() })
    .eq("id", user.id);
  return { ok: true };
}

export async function markRatingPromptClaimed() {
  const user = await requireOnboardingUser();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      rating_prompt_claimed_at: new Date().toISOString(),
      rating_prompt_seen_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  return { ok: true };
}

export async function finishOnboarding(answers: OnboardingAnswers) {
  const user = await requireOnboardingUser();

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      onboarding_answers: cleanOnboardingAnswers(answers),
      onboarding_completed_at: now,
    }, { onConflict: "id" });

  if (error) return { ok: false, message: "Could not finish onboarding. Try again." };

  try {
    await claimSavedPermanentPromoForUser(user.id);
    await claimIncomingReferral(user.id);
    await qualifyReferralForUser(user.id);
  } catch {
    // Onboarding completion is the user-facing critical path; referral credit
    // can be repaired from the cookie/event tables without blocking entry.
  }

  revalidatePath("/home");
  revalidatePath("/onboarding");
  return { ok: true };
}

import "server-only";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isValidReferralCode,
  normalizeReferralCode,
  referralCodeFromName,
} from "./referrals";

const REFERRAL_COOKIE = "marginalia_referral_code";

type ReferralCodeRow = {
  code: string;
  user_id: string;
};

function fallbackCode(userId: string) {
  return referralCodeFromName("READER", userId);
}

export async function getOrCreateReferralCode(userId: string, displayName?: string | null): Promise<string> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code as string;

  const base = referralCodeFromName(displayName, userId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = attempt === 0 ? base : normalizeReferralCode(`${base}-${attempt + 1}`);
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ user_id: userId, code })
      .select("code")
      .single();
    if (!error && data?.code) return data.code as string;
  }

  return fallbackCode(userId);
}

export async function claimIncomingReferral(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const code = normalizeReferralCode(cookieStore.get(REFERRAL_COOKIE)?.value ?? "");
  if (!isValidReferralCode(code)) return;

  const supabase = createServiceClient();
  const { data: referralCode } = await supabase
    .from("referral_codes")
    .select("code, user_id")
    .eq("code", code)
    .maybeSingle<ReferralCodeRow>();
  if (!referralCode) return;

  if (referralCode.user_id === userId) {
    cookieStore.delete(REFERRAL_COOKIE);
    return;
  }

  const { data: existing } = await supabase
    .from("referral_events")
    .select("id")
    .eq("referred_user_id", userId)
    .maybeSingle();
  if (existing?.id) {
    cookieStore.delete(REFERRAL_COOKIE);
    return;
  }

  await supabase.from("referral_events").insert({
    referrer_user_id: referralCode.user_id,
    referred_user_id: userId,
    code: referralCode.code,
    status: "pending",
  });
  cookieStore.delete(REFERRAL_COOKIE);
}

export async function qualifyReferralForUser(userId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("referral_events")
    .update({ status: "qualified", qualified_at: new Date().toISOString() })
    .eq("referred_user_id", userId)
    .eq("status", "pending");
}

export async function countQualifiedReferrals(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("referral_events")
    .select("id", { count: "exact", head: true })
    .eq("referrer_user_id", userId)
    .eq("status", "qualified");
  return count ?? 0;
}


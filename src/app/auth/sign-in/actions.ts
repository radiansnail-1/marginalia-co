"use server";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidReferralCode, normalizeReferralCode } from "@/lib/growth/referrals";
import { savePermanentPromoCookie } from "@/lib/growth/promotions-server";

type SignupResult = {
  message: string;
  ok: boolean;
};

type ReferralCodeResult = SignupResult & {
  code?: string;
};

function signupErrorMessage(raw: string) {
  const message = raw.toLowerCase();
  if (message.includes("already")) return "An account with that email is already open. Try signing in.";
  if (message.includes("password")) return "Passphrase needs at least 6 characters.";
  if (message.includes("email")) return "That email didn't take. Try another.";
  return "Could not open the account. Try again in a moment.";
}

export async function createConfirmedAccount(email: string, password: string): Promise<SignupResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) return { ok: false, message: "Email and passphrase are required." };
  if (password.length < 6) return { ok: false, message: "Passphrase needs at least 6 characters." };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    return { ok: true, message: "Account opened. Stepping inside..." };
  } catch (error) {
    return {
      ok: false,
      message: signupErrorMessage(error instanceof Error ? error.message : ""),
    };
  }
}

export async function saveReferralCode(input: string): Promise<ReferralCodeResult> {
  const code = normalizeReferralCode(input);
  if (!code) return { ok: true, message: "" };

  if (await savePermanentPromoCookie(code)) {
    return { ok: true, code, message: "Permanent library pass saved." };
  }

  if (!isValidReferralCode(code)) {
    return { ok: false, message: "That code looks too short. Check it and try again." };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("code", code)
      .maybeSingle<{ code: string }>();

    if (error) throw error;
    if (!data?.code) return { ok: false, message: "That code was not found." };

    const cookieStore = await cookies();
    cookieStore.set("marginalia_referral_code", data.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return { ok: true, code: data.code, message: "Promo code saved." };
  } catch {
    return { ok: false, message: "Promo codes are not ready yet. Try the invite link instead." };
  }
}

"use server";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isPermanentFreePromoCode,
  PERMANENT_FREE_PROMO_CODE,
  PROMO_COOKIE,
} from "./promotions";

const PROMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function savePermanentPromoCookie(input: string) {
  if (!isPermanentFreePromoCode(input)) return false;

  const cookieStore = await cookies();
  cookieStore.set(PROMO_COOKIE, PERMANENT_FREE_PROMO_CODE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PROMO_COOKIE_MAX_AGE,
    path: "/",
  });

  return true;
}

export async function claimSavedPermanentPromoForUser(userId: string) {
  const cookieStore = await cookies();
  const code = cookieStore.get(PROMO_COOKIE)?.value ?? "";
  if (!isPermanentFreePromoCode(code)) return { ok: true, claimed: false };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      plus_access_source: "permanent_promo",
      plus_promo_code: PERMANENT_FREE_PROMO_CODE,
      plus_unlocked_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { ok: false, claimed: false, message: "Could not apply the promo code yet." };

  return { ok: true, claimed: true };
}

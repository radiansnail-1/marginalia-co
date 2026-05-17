import { normalizeReferralCode } from "./referrals.ts";

export const PERMANENT_FREE_PROMO_CODE = "NLBISTHEBESTLIBRARY";
export const PERMANENT_FREE_PROMO_DISPLAY = "NLBisthebestlibrary";
export const PROMO_COOKIE = "marginalia_promo_code";

export function normalizePromoCode(input: string): string {
  return normalizeReferralCode(input);
}

export function isPermanentFreePromoCode(input: string): boolean {
  return normalizePromoCode(input).replaceAll("-", "") === PERMANENT_FREE_PROMO_CODE;
}

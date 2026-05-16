import { NextRequest, NextResponse } from "next/server";
import { isValidReferralCode, normalizeReferralCode } from "@/lib/growth/referrals";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  const validCode = isValidReferralCode(normalized) ? normalized : "";
  const redirect = new URL("/auth/sign-in", request.url);
  if (validCode) redirect.searchParams.set("ref", validCode);

  const response = NextResponse.redirect(redirect);
  if (validCode) {
    response.cookies.set("marginalia_referral_code", validCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}

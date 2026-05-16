import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  countQualifiedReferrals,
  getOrCreateReferralCode,
} from "@/lib/growth/referral-server";

function originFromHeaders(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "https://marginalia-co.vercel.app";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function OnboardingPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) redirect("/auth/sign-in");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) redirect("/home");
  if (profile?.onboarding_completed_at) redirect("/home");

  const [referralCode, referralCount, headerList] = await Promise.all([
    getOrCreateReferralCode(user.id, profile?.display_name ?? user.email).catch(() => "READER"),
    countQualifiedReferrals(user.id).catch(() => 0),
    headers(),
  ]);
  const inviteLink = `${originFromHeaders(headerList)}/invite/${encodeURIComponent(referralCode)}`;

  return (
    <OnboardingClient
      displayName={profile?.display_name ?? user.email?.split("@")[0] ?? "Reader"}
      inviteLink={inviteLink}
      playStoreUrl="https://play.google.com/store/apps/details?id=com.app.marginaliaandco"
      referralCode={referralCode}
      referralCount={referralCount}
    />
  );
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { TabBar } from "@/components/tab-bar";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && !profile?.onboarding_completed_at) redirect("/onboarding");
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[440px] overflow-x-hidden md:max-w-3xl">
      <main style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>{children}</main>
      <TabBar />
    </div>
  );
}

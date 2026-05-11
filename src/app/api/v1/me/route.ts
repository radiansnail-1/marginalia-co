import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, reading_goal")
    .eq("id", auth.userId)
    .maybeSingle();

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { count } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .eq("status", "finished")
    .gte("finished_at", yearStart);

  return NextResponse.json({
    user_id: auth.userId,
    display_name: profile?.display_name ?? null,
    bio: profile?.bio ?? null,
    reading_goal: profile?.reading_goal ?? 60,
    finished_this_year: count ?? 0,
  });
}

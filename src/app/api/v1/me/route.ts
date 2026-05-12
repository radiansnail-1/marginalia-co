import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api/auth";
import { ApiTimer, withServerTiming } from "@/lib/api/timing";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const timer = new ApiTimer();
  const auth = await authenticate(req, timer);
  if (auth instanceof NextResponse) return withServerTiming(auth, timer);

  const supabase = createServiceClient();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const [{ data: profile }, { count }] = await Promise.all([
    timer.measure("db.profile", () =>
      supabase
        .from("profiles")
        .select("display_name, bio, reading_goal")
        .eq("id", auth.userId)
        .maybeSingle(),
    ),
    timer.measure("db.finished_count", () =>
      supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "finished")
        .gte("finished_at", yearStart),
    ),
  ]);

  return withServerTiming(NextResponse.json({
    user_id: auth.userId,
    display_name: profile?.display_name ?? null,
    bio: profile?.bio ?? null,
    reading_goal: profile?.reading_goal ?? 60,
    finished_this_year: count ?? 0,
  }), timer);
}

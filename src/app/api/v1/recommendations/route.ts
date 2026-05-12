import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, jsonError } from "@/lib/api/auth";
import { ApiTimer, withServerTiming } from "@/lib/api/timing";
import { recommend, MOODS, type Mood } from "@/lib/librarian/recommend";

export const runtime = "nodejs";

const InputSchema = z.object({
  mood: z.enum(MOODS as [Mood, ...Mood[]]),
});

export async function POST(req: NextRequest) {
  const timer = new ApiTimer();
  const auth = await authenticate(req, timer);
  if (auth instanceof NextResponse) return withServerTiming(auth, timer);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError(400, "Body must be JSON."); }
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.message);

  const result = await timer.measure("recommend", () =>
    recommend({ userId: auth.userId, mood: parsed.data.mood }),
  );
  return withServerTiming(NextResponse.json(result), timer);
}

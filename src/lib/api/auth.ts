import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const TOKEN_PREFIX = "mg_";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken(): { token: string; hash: string; prefix: string } {
  const random = randomBytes(24).toString("base64url");
  const token = `${TOKEN_PREFIX}${random}`;
  return { token, hash: hashToken(token), prefix: token.slice(0, 12) };
}

export type AuthedRequest = {
  userId: string;
  tokenId: string;
};

export async function authenticate(req: NextRequest): Promise<AuthedRequest | NextResponse> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return NextResponse.json(
      { error: "Missing bearer token. Pass an API token in the Authorization header." },
      { status: 401 },
    );
  }
  const token = match[1].trim();
  if (!token.startsWith(TOKEN_PREFIX)) {
    return NextResponse.json({ error: "Token format not recognized." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("api_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !row || row.revoked_at) {
    return NextResponse.json({ error: "Token not recognized or revoked." }, { status: 401 });
  }

  // Best-effort last-used update; never blocks the request.
  void supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  return { userId: row.user_id as string, tokenId: row.id as string };
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

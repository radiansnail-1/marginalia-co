"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { mintToken, hashToken } from "@/lib/api/auth";

export async function listTokens() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { tokens: [] as Array<{ id: string; label: string; prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null }> };
  const { data } = await supabase
    .from("api_tokens")
    .select("id, label, token_prefix, created_at, last_used_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return {
    tokens: (data ?? []).map((t) => ({
      id: t.id as string,
      label: (t.label ?? "untitled token") as string,
      prefix: (t.token_prefix ?? "mg_") as string,
      created_at: t.created_at as string,
      last_used_at: (t.last_used_at as string | null) ?? null,
      revoked_at: (t.revoked_at as string | null) ?? null,
    })),
  };
}

export async function createApiToken(label: string): Promise<{ token: string; prefix: string; id: string } | { error: string }> {
  const trimmed = label.trim() || "untitled token";
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };
  const { token, hash, prefix } = mintToken();
  const { data, error } = await supabase
    .from("api_tokens")
    .insert({ user_id: user.id, label: trimmed, token_hash: hash, token_prefix: prefix })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create token." };
  return { token, prefix, id: data.id as string };
}

export async function revokeApiToken(id: string): Promise<{ ok: true } | { error: string }> {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Sign in first." };
  const { error } = await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}

// Re-export hashToken so other server modules can reuse if needed
export { hashToken };

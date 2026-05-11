import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

export function isAnonymousUser(user: User | null | undefined): boolean {
  return !!(user as (User & { is_anonymous?: boolean }) | null | undefined)?.is_anonymous;
}

// Dedupes supabase.auth.getUser() across a single server render so layouts +
// pages + server actions in the same request only round-trip once.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

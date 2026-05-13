"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export async function startReading(userBookId: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };
  await supabase
    .from("user_books")
    .update({ status: "reading", started_at: new Date().toISOString() })
    .eq("id", userBookId)
    .eq("user_id", user.id);
  revalidatePath("/pile");
  revalidatePath("/home");
  revalidatePath("/reading");
  revalidatePath("/shelf");
  return { ok: true };
}

export async function abandonFromPile(userBookId: string) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return { error: "Not signed in" };
  await supabase
    .from("user_books")
    .update({ status: "abandoned" })
    .eq("id", userBookId)
    .eq("user_id", user.id);
  revalidatePath("/pile");
  revalidatePath("/home");
  revalidatePath("/shelf");
  return { ok: true };
}

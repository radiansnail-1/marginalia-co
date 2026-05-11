"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function startReading(userBookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  await supabase
    .from("user_books")
    .update({ status: "reading", started_at: new Date().toISOString() })
    .eq("id", userBookId)
    .eq("user_id", user.id);
  revalidatePath("/pile");
  revalidatePath("/home");
  revalidatePath("/reading");
  return { ok: true };
}

export async function abandonFromPile(userBookId: string) {
  const supabase = await createClient();
  await supabase
    .from("user_books")
    .update({ status: "abandoned" })
    .eq("id", userBookId);
  revalidatePath("/pile");
  return { ok: true };
}

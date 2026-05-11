"use server";

import { createServiceClient } from "@/lib/supabase/service";

type SignupResult = {
  message: string;
  ok: boolean;
};

function signupErrorMessage(raw: string) {
  const message = raw.toLowerCase();
  if (message.includes("already")) return "An account with that email is already open. Try signing in.";
  if (message.includes("password")) return "Passphrase needs at least 6 characters.";
  if (message.includes("email")) return "That email didn't take. Try another.";
  return "Could not open the account. Try again in a moment.";
}

export async function createConfirmedAccount(email: string, password: string): Promise<SignupResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) return { ok: false, message: "Email and passphrase are required." };
  if (password.length < 6) return { ok: false, message: "Passphrase needs at least 6 characters." };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    return { ok: true, message: "Account opened. Stepping inside..." };
  } catch (error) {
    return {
      ok: false,
      message: signupErrorMessage(error instanceof Error ? error.message : ""),
    };
  }
}

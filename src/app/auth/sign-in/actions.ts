"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";

type SignupResult = {
  message: string;
  ok: boolean;
};

function authOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Could not determine auth email origin.");
  return `${proto}://${host}`;
}

function signupErrorMessage(raw: string) {
  const message = raw.toLowerCase();
  if (message.includes("already")) return "An account with that email is already open. Try signing in.";
  if (message.includes("password")) return "Passphrase needs at least 6 characters.";
  if (message.includes("email")) return "That email didn't take. Try another.";
  if (message.includes("domain") || message.includes("from")) {
    return "The library desk could not send mail yet. Check the Resend sender domain.";
  }
  return "Could not open the account. Try again in a moment.";
}

function confirmationEmail(link: string) {
  return {
    subject: "Open your Marginalia shelf",
    text: [
      "Welcome to Marginalia & Co.",
      "",
      "Open your reading room:",
      link,
      "",
      "If you did not request this, you can ignore this note.",
    ].join("\n"),
    html: `
      <div style="background:#1a0905;color:#f5e2b8;font-family:Georgia,serif;padding:32px">
        <div style="max-width:520px;margin:0 auto">
          <p style="letter-spacing:0.24em;text-transform:uppercase;color:#d6a84f;font-size:12px">Marginalia &amp; Co.</p>
          <h1 style="font-weight:400;color:#f9d36a">Open your reading room</h1>
          <p style="line-height:1.6">Confirm this email to keep your shelf, ratings, and Librarian notes across devices.</p>
          <p style="margin:28px 0">
            <a href="${link}" style="background:#c99a4a;color:#1a0905;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
              Enter the library
            </a>
          </p>
          <p style="font-size:13px;color:#d9bf8d;line-height:1.5">If the button does not work, paste this link into your browser:<br>${link}</p>
        </div>
      </div>
    `,
  };
}

export async function requestSignupEmail(email: string, password: string): Promise<SignupResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) return { ok: false, message: "Email and passphrase are required." };
  if (password.length < 6) return { ok: false, message: "Passphrase needs at least 6 characters." };

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: trimmedEmail,
      password,
    });
    if (error) throw error;

    const origin = authOrigin(await headers());
    const tokenHash = data.properties.hashed_token;
    const confirmUrl = new URL("/auth/confirm", origin);
    confirmUrl.searchParams.set("token_hash", tokenHash);
    confirmUrl.searchParams.set("type", "signup");

    await sendEmail({
      to: trimmedEmail,
      ...confirmationEmail(confirmUrl.toString()),
    });

    return { ok: true, message: "Check your email to finish opening the account." };
  } catch (error) {
    return {
      ok: false,
      message: signupErrorMessage(error instanceof Error ? error.message : ""),
    };
  }
}

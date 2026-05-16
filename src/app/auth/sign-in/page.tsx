"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Letter } from "@/components/letter";
import { Owl } from "@/components/owl";
import { createConfirmedAccount, saveReferralCode } from "./actions";

function brandedAuthError(raw: string, mode: "signin" | "signup"): string {
  const m = raw.toLowerCase();
  if (m.includes("rate limit")) return "Too many tries. Give it a minute, then try again.";
  if (m.includes("email") && m.includes("invalid")) return "That email didn't take. Try another.";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Those don't match. Check the email and passphrase.";
  if (m.includes("user already") || m.includes("already registered")) return "An account with that email is already open. Try signing in.";
  if (m.includes("password") && m.includes("short")) return "Passphrase needs at least 6 characters.";
  if (m.includes("not found") || m.includes("no user")) return "We can't find that email. Open an account instead?";
  if (m.includes("network") || m.includes("fetch")) return "Network's quiet. Check your connection and try again.";
  return mode === "signup"
    ? "Could not open the account. Try again in a moment."
    : "Something's stuck. Try again in a moment.";
}

export default function SignInPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error" | "success">("idle");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  function resetFeedback() {
    setStatus("idle");
    setMsg("");
  }

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setMsg("");
    const supabase = createClient();
    try {
      const referralResult = await saveReferralCode(referralCode);
      if (!referralResult.ok) {
        setMsg(referralResult.message);
        setStatus("error");
        return;
      }

      if (mode === "signup") {
        const result = await createConfirmedAccount(email, password);
        setMsg(result.message);
        if (!result.ok) {
          setStatus("error");
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setMsg(brandedAuthError(err instanceof Error ? err.message : "", mode));
      setStatus("error");
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center overflow-hidden px-6">
      <Owl className="absolute -right-2 top-6 h-24 w-20 opacity-90" />
      <div className="absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-moonlight/10 blur-3xl" />

      <div className="relative mb-2 h-20 w-32 animate-[float_4s_ease-in-out_infinite]">
        <Letter className="h-full w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.6)]" />
      </div>

      <h1 className="font-display text-3xl text-brass-bright">Keep your shelf</h1>
      <p className="mt-2 max-w-xs text-center font-display italic text-parchment-dim">
        Create an account so your books, ratings, and tools follow you from phone to laptop.
      </p>

      <div className="mt-6 flex rounded-full border border-brass/30 bg-mahogany-2 p-1 text-xs font-display uppercase tracking-widest">
        <button
          type="button"
          onClick={() => { setMode("signup"); resetFeedback(); }}
          className={`tap rounded-full px-4 py-1.5 transition ${mode === "signup" ? "bg-brass text-mahogany" : "text-parchment-dim"}`}
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => { setMode("signin"); resetFeedback(); }}
          className={`tap rounded-full px-4 py-1.5 transition ${mode === "signin" ? "bg-brass text-mahogany" : "text-parchment-dim"}`}
        >
          Sign in
        </button>
      </div>

      <form onSubmit={emailSubmit} className="mt-5 w-full">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-brass/30 bg-mahogany-2 px-4 py-3 font-body text-parchment placeholder:text-parchment-dim focus:border-brass focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="passphrase"
          className="mt-3 w-full rounded-md border border-brass/30 bg-mahogany-2 px-4 py-3 font-body text-parchment placeholder:text-parchment-dim focus:border-brass focus:outline-none"
        />
        <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.24em] text-parchment-dim">
          Promo or invite code
        </label>
        <input
          type="text"
          autoComplete="off"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="BRIAN-READS"
          className="mt-2 w-full rounded-md border border-brass/30 bg-mahogany-2 px-4 py-3 font-body uppercase tracking-[0.14em] text-parchment placeholder:tracking-normal placeholder:text-parchment-dim focus:border-brass focus:outline-none"
        />
        <button
          disabled={status === "working"}
          className="tap mt-4 w-full rounded-md bg-brass px-4 py-3 font-display text-mahogany shadow-lg transition hover:bg-brass-bright disabled:opacity-60"
        >
          {status === "working" ? "Just a moment..." : mode === "signin" ? "Step inside" : "Create account"}
        </button>
      </form>

      {(status === "error" || status === "success") && (
        <p className={`mt-4 max-w-xs text-center text-sm ${status === "error" ? "text-sconce" : "text-brass-bright"}`}>
          {msg}
        </p>
      )}

      <p className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-parchment-dim">
        Marginalia &amp; Co. - Est. {new Date().getFullYear()}
      </p>
    </div>
  );
}

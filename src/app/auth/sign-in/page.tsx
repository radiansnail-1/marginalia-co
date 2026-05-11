"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Letter } from "@/components/letter";
import { Owl } from "@/components/owl";

export default function SignInPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  // Email/password fields (only shown if user clicks "use email instead")
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function enterAsGuest() {
    setStatus("working");
    setMsg("");
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      router.push("/home");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Couldn't open the door");
      setStatus("error");
    }
  }

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setMsg("");
    const supabase = createClient();
    try {
      const { error } =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.push("/home");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
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

      <h1 className="font-display text-3xl text-brass-bright">Step inside</h1>
      <p className="mt-2 max-w-xs text-center font-display italic text-parchment-dim">
        No name needed at the door. Your shelf travels with this device.
      </p>

      {!showEmail ? (
        <>
          <button
            onClick={enterAsGuest}
            disabled={status === "working"}
            className="mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brass-bright px-7 py-4 font-display text-lg text-mahogany shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition hover:scale-[1.02] disabled:opacity-60"
          >
            <span aria-hidden>✦</span>
            {status === "working" ? "Opening the door…" : "Enter the library"}
          </button>

          <button
            type="button"
            onClick={() => { setShowEmail(true); setStatus("idle"); setMsg(""); }}
            className="mt-6 text-xs font-display italic text-parchment-dim underline-offset-4 hover:underline"
          >
            Or sign in with email
          </button>
        </>
      ) : (
        <>
          {/* Tabs: sign in / sign up */}
          <div className="mt-6 flex rounded-full border border-brass/30 bg-mahogany-2 p-1 text-xs font-display uppercase tracking-widest">
            <button
              type="button"
              onClick={() => { setMode("signin"); setStatus("idle"); setMsg(""); }}
              className={`rounded-full px-4 py-1.5 transition ${mode === "signin" ? "bg-brass text-mahogany" : "text-parchment-dim"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setStatus("idle"); setMsg(""); }}
              className={`rounded-full px-4 py-1.5 transition ${mode === "signup" ? "bg-brass text-mahogany" : "text-parchment-dim"}`}
            >
              Open account
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
            <button
              disabled={status === "working"}
              className="mt-4 w-full rounded-md bg-brass px-4 py-3 font-display text-mahogany shadow-lg transition hover:bg-brass-bright disabled:opacity-60"
            >
              {status === "working" ? "Just a moment…" : mode === "signin" ? "Step inside" : "Open the door"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowEmail(false)}
            className="mt-4 text-xs font-display italic text-parchment-dim underline-offset-4 hover:underline"
          >
            ← back to guest entry
          </button>
        </>
      )}

      {status === "error" && (
        <p className="mt-4 max-w-xs text-center text-sm text-sconce">{msg}</p>
      )}

      <p className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-parchment-dim">
        Marginalia &amp; Co. · Est. {new Date().getFullYear()}
      </p>
    </div>
  );
}

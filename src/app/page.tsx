import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAnonymousUser } from "@/lib/supabase/user";
import { Owl } from "@/components/owl";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user && !isAnonymousUser(user)) redirect("/home");

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-moonlight/10 blur-3xl" />

      <Owl className="absolute right-4 top-10 h-20 w-16 opacity-70" />

      <p className="font-display text-xs uppercase tracking-[0.5em] text-brass">Marginalia &amp; Co.</p>
      <h1 className="mt-5 font-display text-5xl leading-tight text-parchment">
        A cozy reading <em className="italic text-brass-bright">room</em><br />of your own.
      </h1>
      <p className="mt-6 max-w-sm font-display italic text-parchment-dim">
        Keep your books. Light the lamp. Hand the Librarian a note when you want a recommendation.
      </p>

      <Link
        href="/auth/sign-in"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-brass-bright px-7 py-3 font-display text-mahogany shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition hover:scale-[1.02]"
      >
        <span aria-hidden>*</span>
        Enter the library
      </Link>

      <p className="mt-10 text-[10px] uppercase tracking-[0.4em] text-parchment-dim">
        Singapore - Est. {new Date().getFullYear()}
      </p>
      <div className="mt-5 flex gap-4 text-[10px] uppercase tracking-[0.24em] text-brass-bright">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/license">License</Link>
      </div>
    </div>
  );
}

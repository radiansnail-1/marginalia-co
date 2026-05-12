import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import Link from "next/link";
import { TokenPanel } from "./token-panel";

export default async function ProfilePage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const uid = user?.id ?? "";
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [{ data: profile }, { count: finishedThisYear }] = await Promise.all([
    supabase.from("profiles").select("display_name, bio, reading_goal").eq("id", uid).maybeSingle(),
    supabase
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "finished")
      .gte("finished_at", yearStart),
  ]);

  const goal = profile?.reading_goal ?? 60;
  const done = finishedThisYear ?? 0;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL;

  return (
    <div className="px-4 pt-10">
      <h1 className="font-display text-3xl text-brass-bright">{profile?.display_name ?? "Reader"}</h1>
      {profile?.bio && <p className="mt-1 italic text-parchment-dim">{profile.bio}</p>}

      <section className="mt-6 flex items-center gap-5 rounded-md bg-mahogany-2 p-5 ring-1 ring-brass/20">
        <div
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--color-brass-bright) ${pct * 3.6}deg, var(--color-mahogany-3) 0)` }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-mahogany-2">
            <div className="text-center">
              <div className="font-display text-2xl text-parchment">{done}</div>
              <div className="text-[10px] uppercase tracking-widest text-parchment-dim">of {goal}</div>
            </div>
          </div>
        </div>
        <div>
          <div className="font-display text-lg text-parchment">{new Date().getFullYear()} reading goal</div>
          <div className="text-sm text-parchment-dim">{goal - done} to go</div>
        </div>
      </section>

      <section className="mt-5 rounded-md bg-mahogany-2 p-5 ring-1 ring-brass/20">
        <div className="font-body uppercase text-brass-bright" style={{ fontSize: "10px", letterSpacing: "2.5px" }}>
          Book fund
        </div>
        <p className="mt-2 font-display text-xl text-parchment">
          Help buy books for under-resourced readers.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-parchment-dim">
          A portion of any future Marginalia profits will go toward book access. 100% of direct donations go to the book fund.
        </p>
        {donationUrl ? (
          <Link
            href={donationUrl}
            className="tap mt-4 inline-flex border border-brass bg-brass px-4 py-2 font-body uppercase text-mahogany"
            style={{ fontSize: "10px", letterSpacing: "2px" }}
          >
            Donate
          </Link>
        ) : (
          <div className="mt-4 font-caveat text-brass-bright" style={{ fontSize: "15px" }}>
            Donation link coming soon.
          </div>
        )}
      </section>

      <TokenPanel />
    </div>
  );
}

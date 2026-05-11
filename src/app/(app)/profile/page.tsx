import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("display_name, bio, reading_goal").eq("id", user?.id ?? "").maybeSingle();

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { count: finishedThisYear } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "")
    .eq("status", "finished")
    .gte("finished_at", yearStart);

  const goal = profile?.reading_goal ?? 60;
  const done = finishedThisYear ?? 0;
  const pct = Math.min(100, Math.round((done / goal) * 100));

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
    </div>
  );
}

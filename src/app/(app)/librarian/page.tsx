import { createClient } from "@/lib/supabase/server";

const moods = ["restless", "wistful", "curious", "tender", "fierce", "lost"];

export default async function LibrarianPage() {
  const supabase = await createClient();
  const { data: pick } = await supabase
    .from("librarian_picks")
    .select("blurb, book:books(id, title, author, cover_url)")
    .eq("active", true)
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  const book = pick?.book && (Array.isArray(pick.book) ? pick.book[0] : pick.book);

  return (
    <div className="px-4 pt-10">
      <h1 className="font-display text-3xl text-brass-bright">The Librarian</h1>
      <p className="mt-1 font-display italic text-parchment-dim">
        “Pull up a chair. What mood are we in tonight?”
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {moods.map((m) => (
          <span
            key={m}
            title="coming soon — the Librarian is still sorting volumes"
            className="cursor-default rounded-full border border-brass/40 bg-mahogany-2 px-3 py-1 font-display text-sm text-parchment-dim"
          >
            {m}
          </span>
        ))}
      </div>

      <section className="mt-8 rounded-md bg-mahogany-2 p-4 ring-1 ring-brass/20">
        <div className="mb-2 font-display text-sm uppercase tracking-widest text-brass">This week’s pick</div>
        {book ? (
          <div className="flex gap-4">
            <div className="h-28 w-20 shrink-0 rounded-sm bg-mahogany-3" />
            <div>
              <div className="font-display text-xl text-parchment">{book.title}</div>
              <div className="text-sm text-parchment-dim">{book.author}</div>
              {pick?.blurb && <p className="mt-2 text-sm leading-relaxed text-parchment">{pick.blurb}</p>}
            </div>
          </div>
        ) : (
          <p className="font-display italic text-parchment-dim">No pick this week — the Librarian is reshelving.</p>
        )}
      </section>
    </div>
  );
}

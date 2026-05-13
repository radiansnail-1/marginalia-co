"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { askLibrarian, logLibrarianOpen, markLibrarianNotForMe, saveLibrarianPick } from "./actions";
import type { Recommendation, RecommendResult } from "@/lib/librarian/recommend";

const MOODS = ["restless", "wistful", "curious", "tender", "fierce", "lost"] as const;

export function LibrarianClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const ask = (mood: string) => {
    setActiveMood(mood);
    setError(null);
    setResult(null);
    setShowMore(false);
    setHidden(new Set());
    setNote(null);
    startTransition(async () => {
      const res = await askLibrarian(mood);
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
  };

  const pickKey = (pick: Recommendation) => pick.bookId ?? pick.googleBooksId ?? `${pick.title}|${pick.author}`;
  const visiblePicks = (result?.picks ?? [])
    .filter((pick) => !hidden.has(pickKey(pick)))
    .slice(0, showMore ? 6 : 3);

  const onSave = (pick: Recommendation) => {
    const key = pickKey(pick);
    if (saving.has(key) || saved.has(key)) return;
    setSaving((prev) => new Set(prev).add(key));
    void (async () => {
      const res = await saveLibrarianPick(pick, activeMood);
      if ("ok" in res) {
        setSaved((prev) => new Set(prev).add(key));
        setNote(res.alreadyExisted ? `Already on your shelf (${res.status}).` : `${pick.title} is on your pile.`);
      } else {
        setNote(res.error);
      }
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    })();
  };

  const onNotForMe = (pick: Recommendation) => {
    const key = pickKey(pick);
    setHidden((prev) => new Set(prev).add(key));
    setNote("Noted. The Librarian will steer away from that shelf.");
    void markLibrarianNotForMe(pick, activeMood);
  };

  const onOpen = (pick: Recommendation) => {
    void (async () => {
      const res = await logLibrarianOpen(pick, activeMood);
      if ("ok" in res && res.bookId) router.push(`/books/${res.bookId}`);
      else setNote("Could not open that book yet.");
    })();
  };

  return (
    <div className="px-4 pt-10">
      <h1 className="font-display text-3xl text-brass-bright">The Librarian</h1>
      <p className="mt-1 font-display italic text-parchment-dim">
        “Pull up a chair. What mood are we in tonight?”
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const isActive = activeMood === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => ask(m)}
              disabled={pending}
              className={
                "rounded-full border px-3 py-1 font-display text-sm transition " +
                (isActive
                  ? "border-brass-bright bg-brass text-mahogany"
                  : "border-brass/40 bg-mahogany-2 text-parchment-dim hover:border-brass hover:text-parchment") +
                " disabled:opacity-60"
              }
            >
              {m}
            </button>
          );
        })}
      </div>

      <section className="mt-8 rounded-md bg-mahogany-2 p-4 ring-1 ring-brass/20">
        <div className="mb-3 font-display text-sm uppercase tracking-widest text-brass">
          {activeMood ? `Tonight, for ${activeMood}` : "Tonight's reading"}
        </div>

        {!activeMood && !pending && (
          <p className="font-display italic text-parchment-dim">
            Tap a mood and the Librarian will pull three from the stacks.
          </p>
        )}

        {pending && (
          <p className="font-caveat text-parchment-dim">The Librarian is reaching for the right shelf…</p>
        )}

        {error && (
          <p className="font-display italic text-sconce">{error}</p>
        )}

        {result && (
          <div className="space-y-4">
            {visiblePicks.map((p, i) => {
              const key = pickKey(p);
              const isSaving = saving.has(key);
              const isSaved = saved.has(key);
              return (
              <div key={`${p.title}-${i}`} className="flex gap-4 border-b border-brass/10 pb-4 last:border-b-0 last:pb-0">
                <div className="h-28 w-20 shrink-0 rounded-sm bg-mahogany-3 relative overflow-hidden">
                  {p.coverUrl ? (
                    <Image src={p.coverUrl} alt={p.title} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mahogany-3 to-mahogany">
                      <span
                        className="spine-text font-display"
                        style={{ fontSize: "9px", color: "rgba(236,220,176,0.8)", padding: "8px 0" }}
                      >
                        {p.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpen(p)}
                    className="block text-left font-display text-lg text-parchment hover:underline"
                  >
                    {p.title}
                  </button>
                  <div className="text-sm text-parchment-dim">{p.author}</div>
                  <p className="mt-2 text-sm leading-relaxed text-parchment">{p.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving || isSaved}
                      onClick={() => onSave(p)}
                      className="tap border border-brass px-3 py-1.5 font-body uppercase text-brass-bright disabled:opacity-55"
                      style={{ fontSize: "10px", letterSpacing: "1.8px" }}
                    >
                      {isSaved ? "Saved" : isSaving ? "Saving" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNotForMe(p)}
                      className="tap border border-brass/35 px-3 py-1.5 font-body uppercase text-parchment-dim"
                      style={{ fontSize: "10px", letterSpacing: "1.8px" }}
                    >
                      Not for me
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(p)}
                      className="tap px-2 py-1.5 font-body uppercase text-parchment-dim"
                      style={{ fontSize: "10px", letterSpacing: "1.8px" }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            );})}
            {result.picks.length > 3 && !showMore && (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="tap w-full border border-brass/40 py-3 font-body uppercase text-brass-bright"
                style={{ fontSize: "10px", letterSpacing: "2px" }}
              >
                Show me a few more
              </button>
            )}
            {visiblePicks.length === 0 && (
              <p className="font-display italic text-parchment-dim">
                The Librarian has learned what to avoid. Try another mood.
              </p>
            )}
            {note && (
              <p className="font-caveat text-brass-bright" style={{ fontSize: "15px" }}>{note}</p>
            )}
            {result.note && (
              <p className="font-display italic text-parchment-dim text-xs">{result.note}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

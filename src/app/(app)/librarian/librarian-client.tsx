"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { askLibrarian } from "./actions";
import type { RecommendResult } from "@/lib/librarian/recommend";

const MOODS = ["restless", "wistful", "curious", "tender", "fierce", "lost"] as const;

export function LibrarianClient() {
  const [pending, startTransition] = useTransition();
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = (mood: string) => {
    setActiveMood(mood);
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await askLibrarian(mood);
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
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
            {result.picks.map((p, i) => (
              <div key={`${p.title}-${i}`} className="flex gap-4">
                <div className="h-28 w-20 shrink-0 rounded-sm bg-mahogany-3 relative overflow-hidden">
                  {p.coverUrl ? (
                    <Image src={p.coverUrl} alt={p.title} fill sizes="80px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  {p.fromShelf && p.bookId ? (
                    <Link href={`/books/${p.bookId}`} className="block font-display text-lg text-parchment hover:underline">
                      {p.title}
                    </Link>
                  ) : (
                    <div className="font-display text-lg text-parchment">{p.title}</div>
                  )}
                  <div className="text-sm text-parchment-dim">{p.author}</div>
                  <p className="mt-2 text-sm leading-relaxed text-parchment">{p.reason}</p>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-parchment-dim">
                    {p.fromShelf ? "from your shelf" : "gateway pick"}
                  </div>
                </div>
              </div>
            ))}
            {result.note && (
              <p className="font-display italic text-parchment-dim text-xs">{result.note}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

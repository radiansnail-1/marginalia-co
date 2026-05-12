"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { paletteFor } from "@/components/room/spine";

export type ShelfBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  spine_color: string | null;
  dominant_color: string | null;
  rating: number | null;
  finished_at: string | null;
};

type ChipKey = "all" | "five" | "recent";

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "five", label: "★ 5" },
  { key: "recent", label: "Recent" },
];

export function ShelfClient({ books, romanYear }: { books: ShelfBook[]; romanYear: string }) {
  const [active, setActive] = useState<ChipKey>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = books;
    if (active === "five") next = next.filter((b) => (b.rating ?? 0) >= 5);
    if (active === "recent") {
      // Books are already sorted by finished_at desc on the server; take the latest 10.
      next = next.filter((b) => !!b.finished_at).slice(0, 10);
    }
    if (!q) return next;
    return next.filter((b) =>
      `${b.title} ${b.author}`.toLowerCase().includes(q),
    );
  }, [books, active, query]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-6 pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/home"
          className="font-body uppercase tracking-[2px] text-brass-bright"
          style={{ fontSize: "12px" }}
        >
          {"< back"}
        </Link>
        <div
          className="font-display italic"
          style={{ fontSize: "16px", color: "var(--color-cream)" }}
        >
          The Collection
        </div>
        <span style={{ width: 40 }} />
      </div>

      <h1 className="mt-8 font-display" style={{ fontSize: "32px", fontWeight: 500 }}>
        <span className="italic text-brass-bright">{books.length}</span> volumes
      </h1>
      <p
        className="mt-1 font-body uppercase"
        style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(236,220,176,0.5)" }}
      >
        {romanYear} - {books.length > 0 ? "tap a volume" : "your collection lives here"}
      </p>

      {books.length > 0 && (
        <>
          <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {CHIPS.map((c) => {
              const isActive = c.key === active;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActive(c.key)}
                  className="tap rounded-full border font-body uppercase"
                  style={{
                    padding: "6px 12px",
                    fontSize: "9px",
                    letterSpacing: "2px",
                    borderColor: isActive ? "var(--color-brass)" : "rgba(181,140,74,0.35)",
                    background: isActive ? "var(--color-brass)" : "transparent",
                    color: isActive ? "var(--color-mahogany)" : "rgba(236,220,176,0.7)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center border-b border-brass/25">
            <input
              type="search"
              aria-label="Search your collection"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search title or author"
              className="min-w-0 flex-1 bg-transparent pb-2 font-display text-parchment outline-none placeholder:text-parchment-dim/50"
              style={{ fontSize: "18px" }}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear collection search"
                onClick={() => setQuery("")}
                className="tap mb-2 grid h-8 w-8 place-items-center rounded-full font-body text-brass-bright hover:bg-brass/10"
                style={{ fontSize: "12px" }}
              >
                X
              </button>
            )}
          </div>
        </>
      )}

      {books.length === 0 ? (
        <div
          className="mt-12 border border-dashed border-brass/30 p-8 text-center font-display italic"
          style={{ color: "var(--color-parchment-dim)" }}
        >
          No volumes yet. Finish a book to fill your shelf.
          <div className="mt-3">
            <Link href="/pile" className="text-brass-bright underline">
              Go to the pile
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="mt-12 border border-dashed border-brass/30 p-8 text-center font-display italic"
          style={{ color: "var(--color-parchment-dim)" }}
        >
          No volumes match this filter.
        </div>
      ) : (
        <div className="mt-6 grid gap-2.5">
          {filtered.map((b) => {
            const bg = paletteFor(b);
            const stars = b.rating ? `${b.rating} / 5` : "unrated";
            return (
              <Link
                key={b.id}
                href={`/books/${b.id}`}
                className="tap flex min-h-[78px] items-stretch overflow-hidden border border-brass/20 bg-mahogany-2/55"
              >
                <div
                  className="w-4 shrink-0"
                  style={{
                    background: bg,
                    boxShadow: "inset -1px 0 0 rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.08)",
                  }}
                />
                <div className="min-w-0 flex-1 px-3 py-3">
                  <div className="truncate font-display text-cream" style={{ fontSize: "17px", lineHeight: 1.15 }}>
                    {b.title}
                  </div>
                  <div
                    className="truncate font-body italic"
                    style={{
                      fontSize: "10px",
                      color: "rgba(236,220,176,0.55)",
                      marginTop: "3px",
                    }}
                  >
                    {b.author}
                  </div>
                  <div
                    className="mt-3 font-body uppercase"
                    style={{ fontSize: "9px", letterSpacing: "1.6px", color: "rgba(216,176,106,0.75)" }}
                  >
                    {stars}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

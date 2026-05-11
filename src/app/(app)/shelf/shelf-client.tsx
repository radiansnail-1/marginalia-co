"use client";

import Image from "next/image";
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

  const filtered = useMemo(() => {
    if (active === "five") return books.filter((b) => (b.rating ?? 0) >= 5);
    if (active === "recent") {
      // Books are already sorted by finished_at desc on the server; take the latest 10.
      return books.filter((b) => !!b.finished_at).slice(0, 10);
    }
    return books;
  }, [books, active]);

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
        {romanYear} - {books.length > 0 ? "tap a spine" : "your collection lives here"}
      </p>

      {books.length > 0 && (
        <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {CHIPS.map((c) => {
            const isActive = c.key === active;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActive(c.key)}
                className="rounded-full border font-body uppercase"
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
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-4">
          {filtered.map((b) => {
            const bg = paletteFor(b);
            const isCream = bg.includes("#c8a878") || bg.includes("#b58c4a");
            return (
              <Link key={b.id} href={`/books/${b.id}`} className="block">
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    aspectRatio: "2 / 3",
                    background: bg,
                    boxShadow: "0 5px 12px rgba(0,0,0,0.6)",
                    borderRadius: "1px",
                  }}
                >
                  {b.cover_url ? (
                    <Image src={b.cover_url} alt={b.title} fill sizes="120px" className="object-cover" />
                  ) : (
                    <>
                      <span
                        aria-hidden
                        className="absolute left-1 right-1"
                        style={{ top: "8%", height: "1px", background: "rgba(216,176,106,0.5)" }}
                      />
                      <span
                        className="spine-text font-display"
                        style={{
                          fontSize: "9px",
                          padding: "6px 0",
                          color: isCream ? "rgba(60,30,10,0.85)" : "rgba(236,220,176,0.85)",
                        }}
                      >
                        {b.title}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-1 font-display leading-tight text-cream" style={{ fontSize: "12px" }}>
                  {b.title}
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: "9px",
                    color: "rgba(236,220,176,0.5)",
                    letterSpacing: "0.5px",
                    marginTop: "1px",
                  }}
                >
                  {b.author}
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

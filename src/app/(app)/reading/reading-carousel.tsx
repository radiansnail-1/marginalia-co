"use client";

import { useEffect, useRef, useState } from "react";
import { ReadingSession } from "./reading-session";

export type ReadingItem = {
  userBookId: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number | null;
  activeSessionId: string | null;
  activeStartedAt: string | null;
};

export function ReadingCarousel({
  items,
  initialIndex,
}: {
  items: ReadingItem[];
  initialIndex: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(initialIndex);

  // Snap to the initial book on mount.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: initialIndex * el.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [initialIndex]);

  // Track which panel is centered for the indicator dots.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        setActiveIdx((prev) => (prev === idx ? prev : idx));
        raf = 0;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const single = items.length === 1;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex h-dvh w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((it) => (
          <div key={it.userBookId} className="h-full w-full shrink-0 snap-start snap-always">
            <ReadingSession
              userBookId={it.userBookId}
              bookId={it.bookId}
              title={it.title}
              author={it.author}
              coverUrl={it.coverUrl}
              pageCount={it.pageCount}
              activeSessionId={it.activeSessionId}
              activeStartedAt={it.activeStartedAt}
            />
          </div>
        ))}
      </div>

      {!single && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[20] flex justify-center gap-2"
          style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
        >
          {items.map((it, i) => (
            <span
              key={it.userBookId}
              aria-hidden
              className="block rounded-full"
              style={{
                width: i === activeIdx ? "20px" : "6px",
                height: "6px",
                background: i === activeIdx ? "var(--color-brass-bright)" : "rgba(236,220,176,0.35)",
                transition: "width 180ms ease, background-color 180ms ease",
              }}
            />
          ))}
        </div>
      )}

      {!single && (
        <div
          className="pointer-events-none absolute inset-x-0 top-3 z-[20] text-center font-caveat"
          style={{ fontSize: "13px", color: "rgba(236,220,176,0.55)" }}
        >
          swipe between {items.length} books on the table
        </div>
      )}
    </div>
  );
}

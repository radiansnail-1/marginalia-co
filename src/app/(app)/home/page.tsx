import Link from "next/link";
import { Room } from "@/components/room/room";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { toRoman, timeOfDayCaveat } from "@/lib/roman";
import type { SpineBook } from "@/components/room/spine";
import type { ReadingBook } from "@/components/room/coffee-table";

type BookRow = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  spine_color?: string | null;
  dominant_color: string | null;
  page_count: number | null;
};

function pick<T>(b: T | T[] | null | undefined): T | null {
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

export default async function HomePage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const userId = user?.id ?? "";

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [{ data: finishedRaw }, { data: readingRaw }] = await Promise.all([
    supabase
      .from("user_books")
      .select(
        "id, finished_at, book:books(id, title, author, cover_url, dominant_color, page_count)",
      )
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("finished_at", yearStart)
      .order("finished_at", { ascending: false }),
    supabase
      .from("user_books")
      .select(
        "id, current_page, book:books(id, title, author, cover_url, dominant_color, page_count)",
      )
      .eq("user_id", userId)
      .eq("status", "reading"),
  ]);

  const finished: SpineBook[] = (finishedRaw ?? [])
    .map((r) => pick<BookRow>(r.book))
    .filter((b): b is BookRow => !!b)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      spine_color: b.spine_color ?? null,
      dominant_color: b.dominant_color,
    }));

  const reading: ReadingBook[] = (readingRaw ?? [])
    .map((r) => pick<BookRow>(r.book))
    .filter((b): b is BookRow => !!b)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_url: b.cover_url,
      spine_color: b.spine_color ?? null,
      dominant_color: b.dominant_color,
      page_count: b.page_count,
    }));

  const year = new Date().getFullYear();
  const volumeCount = finished.length;

  return (
    <div className="room-vignette relative w-full overflow-hidden bg-ink" style={{ height: "calc(100dvh - 78px)" }}>
      {/* App header */}
      <header className="absolute left-0 right-0 top-0 z-[80] flex items-center justify-between px-5 pt-3 pb-2">
        <div
          className="font-display uppercase"
          style={{
            fontSize: "18px",
            fontWeight: 500,
            letterSpacing: "4px",
            color: "var(--color-cream)",
          }}
        >
          Marginalia <i style={{ color: "var(--color-brass-bright)", fontWeight: 400 }}>&amp;</i> Co.
        </div>
        <div className="flex items-center gap-3 text-parchment-dim">
          <Link
            href="/search"
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-full text-base hover:bg-brass/10"
          >
            ⌕
          </Link>
          <Link
            href="/profile"
            aria-label="Settings"
            className="grid h-8 w-8 place-items-center rounded-full text-base hover:bg-brass/10"
          >
            ⚙
          </Link>
        </div>
      </header>

      {/* Stats row */}
      <section className="absolute left-0 right-0 z-[70] flex items-end justify-between px-6 pt-1" style={{ top: "58px" }}>
        <div className="flex items-baseline gap-2.5">
          <div
            className="font-display italic"
            style={{
              fontSize: "38px",
              lineHeight: 1,
              color: "var(--color-brass-bright)",
              fontWeight: 500,
            }}
          >
            {volumeCount}
          </div>
          <div
            className="font-body uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "2.5px",
              color: "rgba(236,220,176,0.55)",
              lineHeight: 1.4,
              paddingBottom: "4px",
            }}
          >
            Volumes<br />
            {toRoman(year)}
          </div>
        </div>
        <span className="font-caveat" style={{ fontSize: "15px", color: "rgba(236,220,176,0.7)" }}>
          {timeOfDayCaveat()}
        </span>
      </section>

      {/* Room — absolute below header/stats */}
      <div className="absolute inset-x-0 z-[10]" style={{ top: "124px", bottom: "0" }}>
        <Room finished={finished} reading={reading} />
      </div>
    </div>
  );
}

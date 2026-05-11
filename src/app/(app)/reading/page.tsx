import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { ReadingCarousel, type ReadingItem } from "./reading-carousel";

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

export default async function ReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const [params, supabase, user] = await Promise.all([
    searchParams,
    createClient(),
    getCurrentUser(),
  ]);

  const { data: items } = await supabase
    .from("user_books")
    .select(
      "id, book_id, started_at, current_page, book:books(id, title, author, cover_url, dominant_color, page_count)",
    )
    .eq("user_id", user?.id ?? "")
    .eq("status", "reading")
    .order("started_at", { ascending: false });

  const reading = (items ?? [])
    .map((r) => {
      const book = pick<BookRow>(r.book);
      if (!book) return null;
      return {
        userBookId: r.id as string,
        bookId: r.book_id as string,
        currentPage: r.current_page as number | null,
        book,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  if (reading.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-mahogany to-mahogany-2 px-6 text-center">
        <p className="font-display italic text-parchment" style={{ fontSize: "24px" }}>
          Nothing on your table yet.
        </p>
        <p className="font-caveat mt-2 text-parchment-dim" style={{ fontSize: "18px" }}>
          pick something to read.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/pile"
            className="tap border border-brass px-5 py-3 font-body uppercase text-brass-bright"
            style={{ fontSize: "11px", letterSpacing: "2.5px" }}
          >
            Open the pile
          </Link>
          <Link
            href="/search"
            className="tap bg-brass px-5 py-3 font-body uppercase text-mahogany"
            style={{ fontSize: "11px", letterSpacing: "2.5px" }}
          >
            Find a new one
          </Link>
        </div>
      </div>
    );
  }

  // Batch active-session lookup for every user_book in one round-trip.
  const userBookIds = reading.map((r) => r.userBookId);
  const { data: openSessions } = await supabase
    .from("reading_sessions")
    .select("id, user_book_id, started_at")
    .in("user_book_id", userBookIds)
    .is("ended_at", null);

  const sessionByBook = new Map<string, { id: string; started_at: string }>();
  for (const s of openSessions ?? []) {
    sessionByBook.set(s.user_book_id as string, {
      id: s.id as string,
      started_at: s.started_at as string,
    });
  }

  const carouselItems: ReadingItem[] = reading.map((r) => {
    const sess = sessionByBook.get(r.userBookId) ?? null;
    return {
      userBookId: r.userBookId,
      bookId: r.book.id,
      title: r.book.title,
      author: r.book.author,
      coverUrl: r.book.cover_url,
      pageCount: r.book.page_count,
      activeSessionId: sess?.id ?? null,
      activeStartedAt: sess?.started_at ?? null,
    };
  });

  const initialIndex = Math.max(
    0,
    carouselItems.findIndex((r) => r.bookId === params.book),
  );

  return <ReadingCarousel items={carouselItems} initialIndex={initialIndex === -1 ? 0 : initialIndex} />;
}

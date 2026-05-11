import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReadingSession } from "./reading-session";

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
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("user_books")
    .select(
      "id, book_id, started_at, current_page, book:books(id, title, author, cover_url, dominant_color, page_count)",
    )
    .eq("user_id", user?.id ?? "")
    .eq("status", "reading")
    .order("started_at", { ascending: false });

  const reading = (items ?? []).map((r) => ({
    userBookId: r.id,
    bookId: r.book_id as string,
    currentPage: r.current_page as number | null,
    book: pick<BookRow>(r.book)!,
  }));

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
            className="border border-brass px-5 py-3 font-body uppercase text-brass-bright"
            style={{ fontSize: "11px", letterSpacing: "2.5px" }}
          >
            Open the pile
          </Link>
          <Link
            href="/search"
            className="bg-brass px-5 py-3 font-body uppercase text-mahogany"
            style={{ fontSize: "11px", letterSpacing: "2.5px" }}
          >
            Find a new one
          </Link>
        </div>
      </div>
    );
  }

  // Find the active session (if any) for the focused book.
  const focusedIdx = Math.max(
    0,
    reading.findIndex((r) => r.bookId === params.book),
  );
  const focused = reading[focusedIdx === -1 ? 0 : focusedIdx] ?? reading[0];

  const { data: activeSession } = await supabase
    .from("reading_sessions")
    .select("id, started_at")
    .eq("user_book_id", focused.userBookId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ReadingSession
      userBookId={focused.userBookId}
      bookId={focused.book.id}
      title={focused.book.title}
      author={focused.book.author}
      coverUrl={focused.book.cover_url}
      pageCount={focused.book.page_count}
      activeSessionId={activeSession?.id ?? null}
      activeStartedAt={activeSession?.started_at ?? null}
      others={reading
        .filter((r) => r.userBookId !== focused.userBookId)
        .map((r) => ({ id: r.book.id, title: r.book.title }))}
    />
  );
}

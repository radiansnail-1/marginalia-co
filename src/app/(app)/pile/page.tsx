import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { PileRow } from "./pile-row";

type BookRow = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  page_count: number | null;
};

function pick<T>(b: T | T[] | null | undefined): T | null {
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

export default async function PilePage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const uid = user?.id ?? "";

  const [{ data: pileRows }, { data: readingRows }] = await Promise.all([
    supabase
      .from("user_books")
      .select(
        "id, book_id, added_from, added_to_pile_at, book:books(id, title, author, cover_url, page_count)",
      )
      .eq("user_id", uid)
      .eq("status", "pile")
      .order("added_to_pile_at", { ascending: false }),
    supabase
      .from("user_books")
      .select(
        "id, book_id, started_at, book:books(id, title, author, cover_url, page_count)",
      )
      .eq("user_id", uid)
      .eq("status", "reading")
      .order("started_at", { ascending: false }),
  ]);

  const pile = (pileRows ?? []).map((r) => ({
    userBookId: r.id as string,
    bookId: r.book_id as string,
    addedFrom: (r.added_from as string | null) ?? null,
    book: pick<BookRow>(r.book)!,
  }));
  const reading = (readingRows ?? []).map((r) => ({
    userBookId: r.id as string,
    bookId: r.book_id as string,
    book: pick<BookRow>(r.book)!,
  }));

  return (
    <div className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-5 pt-10">
      {/* header */}
      <header className="flex items-center justify-between">
        <div
          className="font-display uppercase"
          style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "3.5px", color: "var(--color-cream)" }}
        >
          Marginalia <i style={{ color: "var(--color-brass-bright)", fontWeight: 400 }}>&amp;</i> Co.
        </div>
        <Link
          href="/search"
          className="grid h-8 w-8 place-items-center rounded-full text-base text-parchment-dim hover:bg-brass/10"
          aria-label="Add a book"
        >
          ⌕
        </Link>
      </header>

      <h1 className="mt-8 font-display" style={{ fontSize: "32px", fontWeight: 500, letterSpacing: "0.5px" }}>
        The <span className="italic text-brass-bright">Pile</span>
      </h1>
      <p
        className="mt-1 font-body uppercase"
        style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(236,220,176,0.5)" }}
      >
        — books waiting for you
      </p>

      {pile.length > 0 && (
        <div
          className="mt-6 font-body uppercase"
          style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--color-brass-bright)" }}
        >
          Up next <span className="float-right text-parchment-dim">choose 1 →</span>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {pile.map((p) => (
          <PileRow
            key={p.userBookId}
            userBookId={p.userBookId}
            bookId={p.book.id}
            title={p.book.title}
            author={p.book.author}
            coverUrl={p.book.cover_url}
            pageCount={p.book.page_count}
            addedFrom={p.addedFrom}
            variant="pile"
          />
        ))}
        {pile.length === 0 && (
          <li className="border border-dashed border-brass/30 p-6 text-center font-display italic text-parchment-dim">
            Your pile is empty.{" "}
            <Link href="/search" className="text-brass-bright underline">
              Find something
            </Link>
            .
          </li>
        )}
      </ul>

      {reading.length > 0 && (
        <>
          <div
            className="mt-8 font-body uppercase"
            style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--color-brass-bright)" }}
          >
            Currently reading
          </div>
          <ul className="mt-3 space-y-2">
            {reading.map((p) => (
              <PileRow
                key={p.userBookId}
                userBookId={p.userBookId}
                bookId={p.book.id}
                title={p.book.title}
                author={p.book.author}
                coverUrl={p.book.cover_url}
                pageCount={p.book.page_count}
                addedFrom={null}
                variant="reading"
              />
            ))}
          </ul>
        </>
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}

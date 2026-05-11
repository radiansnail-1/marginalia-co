import Link from "next/link";
import { Spine, type SpineBook } from "./spine";
// Outer wrapper is a <div> (not a <Link>) because each <Spine> is itself a
// <Link href="/books/[id]">. A floating "View all" link gives access to /shelf.

// 7-row shelf-unit fills the wall area (top:14 / bottom:14, abs).
// Rows 1-3 reserve 144px of left padding so the window can sit upper-left.

export function Bookshelf({ books }: { books: SpineBook[] }) {
  const ROWS = 7;

  // Distribute books from bottom row (row 7) upward so an early reader
  // sees their volumes resting on the lowest shelf.
  const rowBooks: SpineBook[][] = Array.from({ length: ROWS }, () => []);
  let r = ROWS - 1;
  for (const b of books) {
    rowBooks[r].push(b);
    if (rowBooks[r].length >= 18) r = Math.max(0, r - 1);
  }

  const empty = books.length === 0;

  return (
    <Link
      href="/shelf"
      aria-label="Open your collection"
      className="tap absolute left-[14px] right-[14px] top-[14px] bottom-[14px] z-[3] flex flex-col bg-gradient-to-b from-[#1a0905] to-[#2c140a] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_0_0_2px_#5a2a18]"
    >
      {/* Side pilasters */}
      <span
        aria-hidden
        className="absolute -left-[2px] top-0 bottom-0 z-[4] w-[10px]"
        style={{
          background:
            "linear-gradient(90deg,#3e1d10 0%,#5a2a18 30%,#7a3e22 50%,#5a2a18 70%,#3e1d10 100%)",
          boxShadow: "inset 2px 0 0 rgba(0,0,0,0.4), inset -2px 0 0 rgba(0,0,0,0.4)",
        }}
      />
      <span
        aria-hidden
        className="absolute -right-[2px] top-0 bottom-0 z-[4] w-[10px]"
        style={{
          background:
            "linear-gradient(90deg,#3e1d10 0%,#5a2a18 30%,#7a3e22 50%,#5a2a18 70%,#3e1d10 100%)",
          boxShadow: "inset 2px 0 0 rgba(0,0,0,0.4), inset -2px 0 0 rgba(0,0,0,0.4)",
        }}
      />

      {rowBooks.map((row, i) => {
        const indented = i < 3;
        const isLast = i === ROWS - 1;
        return (
          <div
            key={i}
            className="relative flex flex-1 items-end"
            style={{
              paddingLeft: indented ? "144px" : "4px",
              paddingRight: "4px",
              paddingBottom: "2px",
              borderBottom: isLast ? "3px solid #2c140a" : "4px solid #5a2a18",
              boxShadow: "0 2px 0 #2c140a, inset 0 -5px 8px rgba(0,0,0,0.55)",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 18%, transparent 85%, rgba(0,0,0,0.4) 100%)",
            }}
          >
            {/* Front-edge of the shelf board */}
            <span
              aria-hidden
              className="absolute -left-[1px] -right-[1px] -bottom-[4px] z-[1] h-[4px]"
              style={{
                background: "linear-gradient(180deg,#7a3e22 0%,#5a2a18 60%,#3e1d10 100%)",
              }}
            />
            {row.map((b) => (
              <Spine key={b.id} book={b} />
            ))}
          </div>
        );
      })}

      {empty && (
        <div
          className="font-caveat absolute inset-0 z-[6] flex flex-col items-center justify-end gap-3 pb-16 pr-3 text-center text-2xl"
          style={{ color: "rgba(236,220,176,0.55)" }}
        >
          <span>your spines will appear here</span>
          <span
            className="font-body uppercase"
            style={{
              border: "1px solid rgba(216,176,106,0.55)",
              color: "var(--color-brass-bright)",
              fontSize: "9px",
              letterSpacing: "2px",
              padding: "6px 10px",
            }}
          >
            Tap to add your first book
          </span>
        </div>
      )}

      {/* "View all" label — visual cue that the shelf taps to /shelf */}
      <span
        aria-hidden
        className="font-body pointer-events-none absolute z-[7] uppercase"
        style={{
          right: "10px",
          top: "4px",
          padding: "3px 8px",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "rgba(236,220,176,0.7)",
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(181,140,74,0.4)",
        }}
      >
        View all ›
      </span>
    </Link>
  );
}

import { Bookshelf } from "./bookshelf";
import { CoffeeTable, type ReadingBook } from "./coffee-table";
import { Window } from "./window";
import { Sconce } from "./sconce";
import type { SpineBook } from "./spine";

export function Room({
  finished,
  reading,
  hiddenFinishedCount = 0,
}: {
  finished: SpineBook[];
  reading: ReadingBook[];
  hiddenFinishedCount?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Wall fills top 68%; floor + rug fill bottom 32% */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          bottom: "32%",
          background:
            "radial-gradient(ellipse at 30% 60%, rgba(255,122,85,0.18) 0%, transparent 55%), radial-gradient(ellipse at 65% 100%, rgba(255,181,107,0.1) 0%, transparent 50%), linear-gradient(180deg,#1a0905 0%,#2c140a 40%,#3e1d10 100%)",
        }}
      >
        {/* Crown molding */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-0 z-[6]"
          style={{
            height: "10px",
            background:
              "linear-gradient(180deg,#5a2a18 0%,#3e1d10 30%,#2c140a 70%,#1a0905 100%)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.6)",
          }}
        />

        {/* Shelf — fills the wall under the crown, above baseboard */}
        <Bookshelf books={finished} hiddenBookCount={hiddenFinishedCount} />

        {/* Window upper-left over rows 1-3 */}
        <Window />

        {/* Sconce to the right of the window */}
        <Sconce />

        {/* Baseboard */}
        <span
          aria-hidden
          className="absolute left-0 right-0 bottom-0 z-[8]"
          style={{
            height: "14px",
            background:
              "linear-gradient(180deg,#7a3e22 0%,#5a2a18 50%,#2c140a 100%)",
            boxShadow:
              "0 -3px 8px rgba(0,0,0,0.5), inset 0 2px 0 rgba(154,85,48,0.4)",
          }}
        />
      </div>

      {/* Floor */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 z-[4]"
        style={{
          height: "32%",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 10%), repeating-linear-gradient(94deg, #1a0a05 0px, #2a140a 3px, #3a1c10 50px, #2a140a 54px, #1a0a05 100px)",
        }}
      />

      {/* Rug */}
      <div
        aria-hidden
        className="absolute bottom-0 z-[5]"
        style={{
          left: "8px",
          right: "8px",
          height: "28%",
          boxShadow: "0 -10px 24px rgba(0,0,0,0.5)",
          background:
            "radial-gradient(ellipse at 20% 50%, #ecdcb0 0%, transparent 8%), radial-gradient(ellipse at 80% 50%, #ecdcb0 0%, transparent 8%), radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, transparent 8%), radial-gradient(ellipse at center, #6a1a18 0%, #4a0e08 65%, #1a0404 100%)",
        }}
      >
        <span
          aria-hidden
          className="absolute"
          style={{
            inset: "8px",
            border: "2px double rgba(200,168,120,0.4)",
          }}
        />
      </div>

      {/* Coffee table */}
      <CoffeeTable readingBooks={reading} />
    </div>
  );
}

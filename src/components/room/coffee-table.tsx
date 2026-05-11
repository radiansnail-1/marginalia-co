import Link from "next/link";
import type { SpineBook } from "./spine";

export type ReadingBook = SpineBook & {
  cover_url: string | null;
  page_count: number | null;
};

export function CoffeeTable({ readingBooks }: { readingBooks: ReadingBook[] }) {
  const has = readingBooks.length > 0;
  const stack = readingBooks.slice(0, 3);

  return (
    <Link
      href="/reading"
      aria-label="Open your reading session"
      className="absolute z-[9] cursor-pointer"
      style={{
        bottom: "8%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "280px",
      }}
    >
      {/* Table-top */}
      <div className="relative">
        <span
          className="font-caveat absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[13px]"
          style={{ top: "-22px", color: "rgba(236,220,176,0.7)" }}
        >
          {has ? "tap the table" : "your current read sits here below"}
        </span>

        {/* Books resting on the table */}
        <div
          className="pointer-events-none absolute z-[10]"
          style={{
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "30px",
          }}
        >
          {has && (
            <>
              {/* Flat stack of up to 3 books on the left */}
              <div
                className="absolute"
                style={{ left: "20px", bottom: "6px", width: "110px" }}
              >
                {stack.slice(1, 4).map((_, i) => {
                  const gradients = [
                    "linear-gradient(180deg,#4a1c1c 0%,#2a0e0c 100%)",
                    "linear-gradient(180deg,#b58c4a 0%,#6a4520 100%)",
                    "linear-gradient(180deg,#1a3a2a 0%,#0a1f14 100%)",
                  ];
                  return (
                    <span
                      key={i}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "8px",
                        marginBottom: "1px",
                        borderRadius: "1px",
                        background: gradients[i % 3],
                        boxShadow:
                          "0 2px 5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                        transform:
                          i === 1
                            ? "rotate(-1deg) translateX(5px)"
                            : i === 2
                            ? "rotate(0.5deg) translateX(-3px)"
                            : undefined,
                      }}
                    />
                  );
                })}
              </div>

              {/* Open book on the right */}
              <span
                className="absolute"
                style={{
                  right: "20px",
                  bottom: "6px",
                  width: "130px",
                  height: "11px",
                  background:
                    "linear-gradient(180deg,#f3e6c4 0%,#d4c094 100%)",
                  borderRadius: "1px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.55)",
                  transform: "rotate(-3deg)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute top-0 h-full"
                  style={{
                    left: "50%",
                    width: "1px",
                    background: "#1a0905",
                  }}
                />
              </span>
              {/* Bookmark */}
              <span
                aria-hidden
                className="absolute"
                style={{
                  right: "14px",
                  bottom: "12px",
                  width: "4px",
                  height: "14px",
                  background: "#c84838",
                  transform: "rotate(-3deg)",
                  zIndex: 11,
                }}
              />
            </>
          )}
        </div>

        {/* Table top */}
        <div
          style={{
            width: "100%",
            height: "36px",
            background:
              "radial-gradient(ellipse at 50% 30%,#7a3e22 0%,#5a2a18 60%,#3e1d10 100%)",
            borderRadius: "3px",
            boxShadow:
              "0 10px 22px rgba(0,0,0,0.7), inset 0 3px 0 rgba(154,85,48,0.3), inset 0 -5px 8px rgba(0,0,0,0.4)",
            position: "relative",
          }}
        >
          <span
            aria-hidden
            className="absolute left-0 right-0"
            style={{
              bottom: "-6px",
              height: "8px",
              background: "linear-gradient(180deg,#2c140a 0%,#1a0905 100%)",
              borderRadius: "0 0 3px 3px",
            }}
          />
        </div>
        {/* Legs */}
        <div className="relative" style={{ width: "100%", height: "26px" }}>
          <span
            aria-hidden
            className="absolute top-0"
            style={{
              left: "18px",
              width: "9px",
              height: "26px",
              background:
                "linear-gradient(90deg,#1a0905 0%,#7a3e22 50%,#1a0905 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.7)",
            }}
          />
          <span
            aria-hidden
            className="absolute top-0"
            style={{
              right: "18px",
              width: "9px",
              height: "26px",
              background:
                "linear-gradient(90deg,#1a0905 0%,#7a3e22 50%,#1a0905 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.7)",
            }}
          />
        </div>
      </div>
    </Link>
  );
}

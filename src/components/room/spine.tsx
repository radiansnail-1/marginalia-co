export type SpineBook = {
  id: string;
  title: string;
  author: string;
  spine_color: string | null;
  dominant_color?: string | null;
};

// Curated palette of spine gradients keyed to iteration-4 .b-* classes.
const PALETTE: string[] = [
  "linear-gradient(95deg,#4a1c1c 0%,#2a0e0c 100%)", // red
  "linear-gradient(95deg,#1a3a2a 0%,#0a1f14 100%)", // green
  "linear-gradient(95deg,#1a2a4a 0%,#0a1428 100%)", // navy
  "linear-gradient(95deg,#c8a878 0%,#8a6f48 100%)", // cream
  "linear-gradient(95deg,#5a3520 0%,#2a1810 100%)", // brown
  "linear-gradient(95deg,#2a1a3a 0%,#14081a 100%)", // plum
  "linear-gradient(95deg,#b58c4a 0%,#6a4520 100%)", // brass
  "linear-gradient(95deg,#c25a3a 0%,#6a2818 100%)", // rust
  "linear-gradient(95deg,#1a4040 0%,#082020 100%)", // teal
  "linear-gradient(95deg,#8a6238 0%,#4a3018 100%)", // tan
  "linear-gradient(95deg,#2a2a2a 0%,#0e0e0e 100%)", // charcoal
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function paletteFor(book: SpineBook): string {
  // Honor explicit spine_color if set (hex like #4a1c1c).
  const explicit = book.spine_color ?? book.dominant_color ?? null;
  if (explicit && explicit.startsWith("#")) {
    return `linear-gradient(95deg,${explicit} 0%,#0e0707 100%)`;
  }
  return PALETTE[hash(book.id || book.title) % PALETTE.length];
}

export function spineWidthFor(seed: string): number {
  // 12 – 15 px stable per book.
  return 12 + (hash(seed) % 4);
}

export function Spine({ book }: { book: SpineBook }) {
  const bg = paletteFor(book);
  const width = spineWidthFor(book.id || book.title);
  const cream = bg.includes("#c8a878") || bg.includes("#b58c4a");
  return (
    <span
      aria-label={`${book.title} by ${book.author}`}
      className="book relative mr-px flex h-[88%] shrink-0 items-center justify-center overflow-hidden rounded-sm"
      style={{
        width: `${width}px`,
        background: bg,
        boxShadow:
          "inset 1.5px 0 0 rgba(255,255,255,0.08), inset -1.5px 0 0 rgba(0,0,0,0.45), inset 0 2px 0 rgba(216,176,106,0.18)",
      }}
    >
      {/* Top brass band */}
      <span
        aria-hidden
        className="absolute left-[2px] right-[2px] top-[8%] h-px"
        style={{ background: "rgba(216,176,106,0.5)" }}
      />
      {/* Bottom brass band */}
      <span
        aria-hidden
        className="absolute bottom-[12%] left-[2px] right-[2px] h-px"
        style={{ background: "rgba(216,176,106,0.5)" }}
      />
      <span
        className="spine-text font-display"
        style={{
          fontSize: "8px",
          letterSpacing: "0.5px",
          padding: "6px 0",
          maxHeight: "100%",
          lineHeight: 1,
          color: cream ? "rgba(60,30,10,0.85)" : "rgba(236,220,176,0.85)",
        }}
      >
        {book.title}
      </span>
    </span>
  );
}

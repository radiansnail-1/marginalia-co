// Inline SVG — a stylized perched owl. Brass eyes, mahogany silhouette.
export function Owl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="owl-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1e10" />
          <stop offset="100%" stopColor="#1a0905" />
        </linearGradient>
      </defs>
      {/* body */}
      <ellipse cx="32" cy="46" rx="20" ry="24" fill="url(#owl-body)" />
      {/* head */}
      <ellipse cx="32" cy="22" rx="16" ry="14" fill="url(#owl-body)" />
      {/* ear tufts */}
      <path d="M18 14 L22 6 L24 16 Z" fill="#1a0905" />
      <path d="M46 14 L42 6 L40 16 Z" fill="#1a0905" />
      {/* eye rings */}
      <circle cx="25" cy="22" r="5" fill="#f3e6c4" />
      <circle cx="39" cy="22" r="5" fill="#f3e6c4" />
      {/* pupils — brass */}
      <circle cx="25" cy="22" r="2.5" fill="#b58c4a" />
      <circle cx="39" cy="22" r="2.5" fill="#b58c4a" />
      <circle cx="25.6" cy="21.4" r="0.7" fill="#f3e6c4" />
      <circle cx="39.6" cy="21.4" r="0.7" fill="#f3e6c4" />
      {/* beak */}
      <path d="M32 26 L29 32 L35 32 Z" fill="#b58c4a" />
      {/* chest feathers (chevrons) */}
      <path d="M22 44 L28 48 L34 44 L40 48 L46 44" fill="none" stroke="#5a3a20" strokeWidth="0.8" opacity="0.6" />
      <path d="M24 52 L30 56 L36 52 L42 56" fill="none" stroke="#5a3a20" strokeWidth="0.8" opacity="0.6" />
      {/* feet */}
      <path d="M26 70 L26 76 M30 70 L30 76 M34 70 L34 76 M38 70 L38 76" stroke="#b58c4a" strokeWidth="1.2" strokeLinecap="round" />
      {/* perch */}
      <rect x="14" y="74" width="36" height="2" rx="1" fill="#3a1e10" />
    </svg>
  );
}

// Inline SVG — a sealed envelope. Wax seal is the brass-bright accent.
export function Letter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3e6c4" />
          <stop offset="100%" stopColor="#d8c499" />
        </linearGradient>
        <radialGradient id="seal" cx="0.4" cy="0.4">
          <stop offset="0%" stopColor="#e8584a" />
          <stop offset="100%" stopColor="#8a2418" />
        </radialGradient>
      </defs>
      {/* envelope body */}
      <rect x="6" y="14" width="108" height="58" rx="3" fill="url(#paper)" stroke="#7a5a30" strokeWidth="1.5" />
      {/* envelope flap (closed) */}
      <path d="M6 14 L60 50 L114 14" fill="none" stroke="#7a5a30" strokeWidth="1.5" />
      <path d="M6 14 L60 50 L114 14 Z" fill="#e8d9ad" opacity="0.5" />
      {/* wax seal */}
      <circle cx="60" cy="46" r="11" fill="url(#seal)" stroke="#3a0a04" strokeWidth="0.8" />
      <text x="60" y="51" textAnchor="middle" fontSize="13" fill="#f3e6c4" fontFamily="serif" fontStyle="italic">M</text>
      {/* tiny postmark */}
      <circle cx="92" cy="26" r="7" fill="none" stroke="#7a5a30" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.6" />
    </svg>
  );
}

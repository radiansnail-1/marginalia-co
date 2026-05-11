import type { AffiliateLink } from "@/lib/books/affiliate";

export function AffiliateLinks({ links }: { links: AffiliateLink[] }) {
  const primary = links.slice(0, 3);
  const secondary = links.slice(3);

  return (
    <section className="mt-8 space-y-3" aria-label="Book buying links">
      <div className="font-body text-[10px] uppercase tracking-[0.28em] text-parchment-dim">
        Choose your copy
      </div>

      <div className="grid gap-2">
        {primary.map((link) => (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="tap flex items-center justify-between rounded-md border border-brass/35 bg-mahogany-2 px-4 py-3 text-left transition hover:border-brass hover:bg-mahogany-3"
          >
            <span className="font-body text-[11px] uppercase tracking-[0.22em] text-brass-bright">
              {link.label}
            </span>
            <span className="font-display text-sm italic text-parchment-dim">{link.note}</span>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {secondary.map((link) => (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="tap rounded-full border border-brass/25 px-3 py-1.5 font-body text-[9px] uppercase tracking-[0.18em] text-parchment-dim transition hover:border-brass hover:text-brass-bright"
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="font-body text-[10px] leading-5 text-parchment-dim/70">
        Some links may be affiliate links. Marginalia &amp; Co. may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
}

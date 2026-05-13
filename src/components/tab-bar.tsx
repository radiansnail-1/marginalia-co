"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabIcon = "room" | "pile" | "librarian" | "profile";

const tabs: { href: string; label: string; icon: TabIcon }[] = [
  { href: "/home", label: "Room", icon: "room" },
  { href: "/pile", label: "Pile", icon: "pile" },
  { href: "/librarian", label: "Librarian", icon: "librarian" },
  { href: "/profile", label: "Me", icon: "profile" },
];

const PARENT_OF: Record<string, string> = {
  "/reading": "/home",
  "/shelf": "/home",
  "/search": "/home",
  "/books": "/pile",
};

function TabGlyph({ kind, active }: { kind: TabIcon; active: boolean }) {
  const stroke = active ? "var(--color-brass-bright)" : "rgba(236,220,176,0.55)";
  const fill = active ? "rgba(216,176,106,0.18)" : "transparent";
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "room") {
    return (
      <svg {...common} aria-hidden>
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M5 10.5V20h14V10.5" />
        <rect x="10" y="13" width="4" height="7" fill={fill} />
      </svg>
    );
  }
  if (kind === "pile") {
    return (
      <svg {...common} aria-hidden>
        <rect x="4" y="6" width="16" height="3" rx="0.5" fill={fill} />
        <rect x="5" y="10" width="14" height="3" rx="0.5" fill={fill} />
        <rect x="6" y="14" width="12" height="3" rx="0.5" fill={fill} />
        <rect x="7" y="18" width="10" height="2" rx="0.5" fill={fill} />
      </svg>
    );
  }
  if (kind === "librarian") {
    return (
      <svg {...common} aria-hidden>
        <path d="M4 5.5C6 4.5 9 4.5 11 5.5v13c-2-1-5-1-7 0v-13z" fill={fill} />
        <path d="M20 5.5C18 4.5 15 4.5 13 5.5v13c2-1 5-1 7 0v-13z" fill={fill} />
        <path d="M12 5.5v13" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <circle cx="12" cy="8.5" r="3.2" fill={fill} />
      <path d="M5 20c1.5-3.6 4-5.4 7-5.4s5.5 1.8 7 5.4" />
    </svg>
  );
}

export function TabBar() {
  const path = usePathname() ?? "";
  const firstSeg = "/" + path.split("/").filter(Boolean)[0];
  const activePath = PARENT_OF[path] ?? PARENT_OF[firstSeg] ?? path;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-[440px] border-t border-brass/25 backdrop-blur"
      style={{
        height: "calc(72px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(180deg, rgba(13,9,7,0.94) 0%, rgba(13,9,7,1) 100%)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="flex h-[72px] items-stretch">
        {tabs.map((t) => {
          const active = activePath === t.href || path === t.href || path.startsWith(t.href + "/");
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className="tap flex h-full flex-col items-center justify-center gap-1.5 uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  letterSpacing: "1.6px",
                  fontWeight: 500,
                  color: active ? "var(--color-brass-bright)" : "rgba(236,220,176,0.55)",
                }}
              >
                <TabGlyph kind={t.icon} active={active} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

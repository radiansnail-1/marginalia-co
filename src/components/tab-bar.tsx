"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const tabs = [
  { href: "/home", label: "Home", glyph: "?" },
  { href: "/pile", label: "The Pile", glyph: "?" },
  { href: "/librarian", label: "Librarian", glyph: "?" },
  { href: "/profile", label: "Profile", glyph: "?" },
];

const PARENT_OF: Record<string, string> = {
  "/reading": "/home",
  "/shelf": "/home",
  "/search": "/home",
  "/books": "/pile",
};

export function TabBar() {
  const path = usePathname() ?? "";
  const router = useRouter();
  const firstSeg = "/" + path.split("/").filter(Boolean)[0];
  const activePath = PARENT_OF[path] ?? PARENT_OF[firstSeg] ?? path;

  useEffect(() => {
    for (const tab of tabs) router.prefetch(tab.href);
  }, [router]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-[440px] border-t border-brass/25 backdrop-blur"
      style={{
        height: "78px",
        background:
          "linear-gradient(180deg, rgba(13,9,7,0.92) 0%, rgba(13,9,7,1) 100%)",
        paddingBottom: "20px",
      }}
    >
      <ul className="flex h-full items-center justify-around">
        {tabs.map((t) => {
          const active = activePath === t.href || path === t.href || path.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                onPointerEnter={() => router.prefetch(t.href)}
                onTouchStart={() => router.prefetch(t.href)}
                className="flex flex-col items-center gap-[3px] uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  fontWeight: 500,
                  color: active ? "var(--color-brass-bright)" : "rgba(236,220,176,0.5)",
                }}
              >
                <span
                  className="font-display italic"
                  style={{
                    fontSize: "19px",
                    fontWeight: 500,
                    textShadow: active ? "0 0 12px rgba(216,176,106,0.5)" : undefined,
                  }}
                >
                  {t.glyph}
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

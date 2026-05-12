"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { startReading } from "./actions";

export function PileRow({
  userBookId,
  bookId,
  title,
  author,
  author2,
  coverUrl,
  pageCount,
  addedFrom,
  variant,
}: {
  userBookId: string;
  bookId: string;
  title: string;
  author: string;
  author2?: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  addedFrom: string | null;
  variant: "pile" | "reading";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onStart = () => {
    startTransition(async () => {
      await startReading(userBookId);
      router.push(`/reading?book=${bookId}`);
    });
  };

  return (
    <li
      className="flex items-center gap-3.5 p-3.5"
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(181,140,74,0.18)",
      }}
    >
      <Link href={`/books/${bookId}`} className="relative h-[76px] w-[50px] shrink-0 overflow-hidden bg-mahogany-3" style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.55)" }}>
        {coverUrl ? (
          <Image src={coverUrl} alt={title} fill sizes="50px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="spine-text font-display"
              style={{ fontSize: "7px", color: "rgba(236,220,176,0.85)", padding: "4px 0" }}
            >
              {title}
            </span>
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/books/${bookId}`}>
          <div className="font-display" style={{ fontSize: "16px", fontWeight: 500, lineHeight: 1.1 }}>
            {title}
          </div>
        </Link>
        <div
          className="font-body italic"
          style={{ fontSize: "10px", color: "rgba(236,220,176,0.55)", marginTop: "2px" }}
        >
          {author2 || author}
        </div>
        {addedFrom && addedFrom !== "api" && (
          <div className="font-caveat" style={{ fontSize: "13px", color: "var(--color-brass-bright)", marginTop: "6px", lineHeight: 1 }}>
            from {addedFrom}
          </div>
        )}
        {pageCount && (
          <div
            className="font-body uppercase"
            style={{ fontSize: "9px", letterSpacing: "1.5px", color: "rgba(236,220,176,0.45)", marginTop: "4px" }}
          >
            {pageCount} pp
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        {variant === "pile" ? (
          <button
            type="button"
            disabled={pending}
            onClick={onStart}
            className="tap border border-brass px-3 py-1.5 font-body uppercase text-brass-bright"
            style={{ fontSize: "9px", letterSpacing: "1.5px" }}
          >
            Start
          </button>
        ) : (
          <Link
            href={`/reading?book=${bookId}`}
            className="tap border border-brass px-3 py-1.5 text-center font-body uppercase text-brass-bright"
            style={{ fontSize: "9px", letterSpacing: "1.5px" }}
          >
            Continue
          </Link>
        )}
      </div>
    </li>
  );
}

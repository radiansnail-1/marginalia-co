"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { startSession, endSession } from "./actions";
import { FinishPrompt } from "@/components/finish-prompt";

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ReadingSession({
  userBookId,
  bookId,
  title,
  author,
  coverUrl,
  pageCount,
  activeSessionId,
  activeStartedAt,
}: {
  userBookId: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number | null;
  activeSessionId: string | null;
  activeStartedAt: string | null;
}) {
  const [sessionId, setSessionId] = useState<string | null>(activeSessionId);
  const [startedAt, setStartedAt] = useState<string | null>(activeStartedAt);
  const [now, setNow] = useState<number>(() => Date.now());
  const [showFinish, setShowFinish] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt
    ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
    : 0;

  const onBegin = () => {
    startTransition(async () => {
      const r = await startSession(userBookId);
      if ("sessionId" in r && r.sessionId) {
        setSessionId(r.sessionId);
        setStartedAt(new Date().toISOString());
      }
    });
  };

  const onPause = () => {
    if (!sessionId) return;
    startTransition(async () => {
      await endSession(sessionId);
      setSessionId(null);
      setStartedAt(null);
    });
  };

  return (
    <div
      className="relative min-h-dvh w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 55%, rgba(255,122,85,0.2) 0%, transparent 60%), radial-gradient(circle at 50% 50%, #2c140a 0%, #1a0905 60%, #0d0907 100%)",
      }}
    >
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-4">
        <Link
          href="/home"
          className="tap font-body uppercase"
          style={{ fontSize: "11px", letterSpacing: "2.5px", color: "rgba(236,220,176,0.6)" }}
        >
          {"< back to room"}
        </Link>
      </div>

      <div className="absolute inset-x-0 z-10 text-center" style={{ top: "78px" }}>
        <div
          className="font-body uppercase"
          style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(236,220,176,0.45)" }}
        >
          — You&rsquo;re reading —
        </div>
        <h1 className="mt-1 font-display" style={{ fontSize: "24px", fontWeight: 500, letterSpacing: "0.5px" }}>
          {title}
        </h1>
        <p className="mt-0.5 font-display italic" style={{ fontSize: "14px", color: "rgba(236,220,176,0.6)" }}>
          {author}
        </p>
      </div>

      {/* Book cover floating */}
      <div className="absolute inset-x-0 z-10 flex justify-center" style={{ top: "170px" }}>
        <div
          className="relative h-[220px] w-[150px] overflow-hidden"
          style={{
            background: "linear-gradient(95deg,#4a1c1c 0%,#2a0e0c 100%)",
            transform: "perspective(800px) rotateY(-10deg) rotateX(4deg)",
            boxShadow:
              "-20px 30px 60px rgba(0,0,0,0.75), inset -4px 0 0 rgba(0,0,0,0.45), inset 4px 0 0 rgba(255,255,255,0.1)",
          }}
        >
          {coverUrl ? (
            <Image src={coverUrl} alt={title} fill sizes="150px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="spine-text font-display"
                style={{ fontSize: "14px", color: "rgba(236,220,176,0.9)", padding: "18px 0" }}
              >
                {title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="absolute inset-x-0 z-10 text-center" style={{ top: "430px" }}>
        <div
          className="font-display"
          style={{
            fontSize: "60px",
            fontWeight: 500,
            color: "var(--color-brass-bright)",
            letterSpacing: "3px",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {fmt(elapsed)}
        </div>
        <div
          className="font-body uppercase"
          style={{ fontSize: "10px", letterSpacing: "4px", color: "rgba(236,220,176,0.5)", marginTop: "10px" }}
        >
          — Session timer —
        </div>
        <div className="font-caveat" style={{ fontSize: "18px", color: "rgba(236,220,176,0.7)", marginTop: "8px" }}>
          {sessionId ? "the candle is steady tonight." : "tap begin to light the candle."}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute inset-x-6 z-10 flex gap-2.5" style={{ bottom: "104px" }}>
        {sessionId ? (
          <button
            type="button"
            disabled={pending}
            onClick={onPause}
            className="tap flex-1 border border-brass font-body uppercase text-brass-bright"
            style={{ padding: "14px", fontSize: "11px", letterSpacing: "2.5px", fontWeight: 600 }}
          >
            Pause &amp; put down
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={onBegin}
            className="tap flex-1 border border-brass font-body uppercase text-brass-bright"
            style={{ padding: "14px", fontSize: "11px", letterSpacing: "2.5px", fontWeight: 600 }}
          >
            Begin chapter
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFinish(true)}
          className="tap flex-1 font-body uppercase"
          style={{
            padding: "14px",
            fontSize: "11px",
            letterSpacing: "2.5px",
            fontWeight: 600,
            background: "var(--color-sconce)",
            color: "var(--color-cream)",
            border: "1px solid var(--color-sconce)",
            boxShadow: "0 6px 16px rgba(200,72,56,0.4)",
          }}
        >
          Finish the book
        </button>
      </div>

      {/* Detail link */}
      <Link
        href={`/books/${bookId}`}
        className="absolute inset-x-0 z-10 text-center font-caveat text-parchment-dim"
        style={{ bottom: "82px", fontSize: "13px" }}
      >
        details ›
      </Link>

      <FinishPrompt
        open={showFinish}
        onClose={() => setShowFinish(false)}
        userBookId={userBookId}
        title={title}
        author={author}
        pageCount={pageCount}
      />
    </div>
  );
}

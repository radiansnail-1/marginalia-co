"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { searchAction, addToPile } from "./actions";
import type { SearchBook, UserBookStatus } from "./actions";

type SearchMeta = Extract<Awaited<ReturnType<typeof searchAction>>, { ok: true }>["meta"];

type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): {
    detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
  };
};

type SearchState =
  | { kind: "idle" }
  | { kind: "searching"; query: string }
  | { kind: "empty"; query: string }
  | { kind: "results"; query: string; books: SearchBook[]; meta: SearchMeta }
  | { kind: "error"; query: string; error: "api" | "rate-limit" | "timeout" | "unknown" };

const statusLabel: Record<UserBookStatus, string> = {
  pile: "On pile",
  reading: "Reading",
  finished: "Finished",
  abandoned: "Set aside",
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, UserBookStatus>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const runSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setState({ kind: "idle" });
      return;
    }
    const myId = ++requestIdRef.current;
    setExpandedKey(null);
    setState({ kind: "searching", query: trimmed });
    startTransition(async () => {
      const res = await searchAction(trimmed);
      // Stale response - ignore.
      if (myId !== requestIdRef.current) return;
      if (!res.ok) {
        setState({ kind: "error", query: trimmed, error: res.error });
        return;
      }
      if (res.books.length === 0) {
        setState({ kind: "empty", query: trimmed });
      } else {
        setState({ kind: "results", query: trimmed, books: res.books, meta: res.meta });
        if (res.meta.partial) setNote("Showing partial results while Google Books is unavailable.");
      }
    });
  }, []);

  const onChange = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      requestIdRef.current += 1;
      setState({ kind: "idle" });
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 320);
  };

  const onRetry = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(q);
  };

  const stopScan = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScan = async () => {
    const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) {
      setNote("Camera scanning is not available here. Type the ISBN instead.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNote("Camera access is unavailable. Type the ISBN instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const video = videoRef.current;
      if (!video) {
        stopScan();
        return;
      }
      video.srcObject = stream;
      await video.play();

      const detector = new Detector({ formats: ["ean_13"] });
      const scan = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const matches = await detector.detect(videoRef.current);
          const code = matches.find((m) => m.rawValue)?.rawValue;
          if (code) {
            stopScan();
            setQ(code);
            setNote(`Scanned ISBN ${code}.`);
            runSearch(code);
            return;
          }
        } catch {
          stopScan();
          setNote("Could not read the barcode. Type the ISBN instead.");
          return;
        }
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch {
      stopScan();
      setNote("Camera permission was blocked. Type the ISBN instead.");
    }
  };

  const onAdd = (g: SearchBook) => {
    if (savingIds.has(g.resultKey) || localStatuses[g.resultKey] || g.shelfStatus) return;
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.add(g.resultKey);
      return next;
    });

    void (async () => {
      try {
        const res = await addToPile(g);
        if ("ok" in res) {
          setLocalStatuses((prev) => ({ ...prev, [g.resultKey]: res.status }));
          setNote(
            res.alreadyExisted
              ? `Already on your shelf (${res.status}).`
              : `${g.title} is on your pile.`,
          );
        } else {
          setNote(res.error);
        }
      } catch {
        setNote("Could not save that book. Try again.");
      }
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(g.resultKey);
        return next;
      });
    })();
  };

  // Auto-dismiss the note after a beat so it doesn't pile up.
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3200);
    return () => clearTimeout(t);
  }, [note]);

  useEffect(() => stopScan, [stopScan]);

  const results = state.kind === "results" ? state.books : [];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-6 pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/home"
          className="font-body uppercase tracking-[2px] text-brass-bright"
          style={{ fontSize: "12px" }}
        >
          {"< back"}
        </Link>
        <div className="font-display italic" style={{ fontSize: "16px", color: "var(--color-cream)" }}>
          Add a volume
        </div>
        <span style={{ width: 40 }} />
      </div>

      <div className="mt-6">
        <h1 className="font-display" style={{ fontSize: "30px", fontWeight: 500 }}>
          search the <span className="italic text-brass-bright">world&rsquo;s</span> books
        </h1>
        <div className="mt-4 flex items-center border-b border-brass/30">
          <input
            type="text"
            role="searchbox"
            aria-label="title, author, or ISBN"
            autoFocus
            value={q}
            onChange={(e) => onChange(e.target.value)}
            placeholder="title, author, or ISBN"
            className="min-w-0 flex-1 bg-transparent pb-2 font-display text-parchment outline-none placeholder:text-parchment-dim/60"
            style={{ fontSize: "20px" }}
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                requestIdRef.current += 1;
                setQ("");
                setState({ kind: "idle" });
                setNote(null);
                setExpandedKey(null);
              }}
              className="tap mb-2 grid h-8 w-8 place-items-center rounded-full font-body text-brass-bright hover:bg-brass/10"
              style={{ fontSize: "14px" }}
            >
              X
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className="tap border border-brass/50 px-3 py-2 font-body uppercase text-brass-bright"
            style={{ fontSize: "10px", letterSpacing: "2px" }}
          >
            {scanning ? "Stop scan" : "Scan ISBN"}
          </button>
          <span
            className="min-w-0 max-w-full font-caveat leading-tight text-parchment-dim"
            style={{ fontSize: "14px", overflowWrap: "anywhere" }}
          >
            camera if supported, manual ISBN always works
          </span>
        </div>
        {scanning && (
          <div className="mt-4 overflow-hidden border border-brass/30 bg-mahogany-3">
            <video ref={videoRef} muted playsInline className="h-52 w-full object-cover" />
          </div>
        )}
      </div>

      {note && (
        <div
          className="mt-4 border border-brass/40 px-3 py-2 font-caveat text-brass-bright"
          style={{ fontSize: "15px" }}
        >
          {note}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {state.kind === "results" && (
          <li className="font-body uppercase text-parchment-dim" style={{ fontSize: "9px", letterSpacing: "1.5px" }}>
            {state.books.length} found in {state.meta.elapsedMs}ms
            {state.meta.partial ? " - partial results" : ""}
          </li>
        )}
        {results.map((g) => {
          const shelfStatus = localStatuses[g.resultKey] ?? g.shelfStatus;
          const saving = savingIds.has(g.resultKey);
          const expanded = expandedKey === g.resultKey;

          return (
            <li
              key={g.resultKey}
              className="bg-mahogany-2/60 p-3 ring-1 ring-brass/20"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedKey((prev) => (prev === g.resultKey ? null : g.resultKey))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedKey((prev) => (prev === g.resultKey ? null : g.resultKey));
                  }
                }}
                className="flex cursor-pointer items-center gap-3"
                aria-expanded={expanded}
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-mahogany-3">
                  {g.thumbnail ? (
                    <Image src={g.thumbnail} alt={g.title} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="spine-text font-display text-parchment-dim" style={{ fontSize: "7px", padding: "4px 0" }}>
                        {g.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-parchment" style={{ fontSize: "16px" }}>
                    {g.title}
                  </div>
                  <div
                    className="truncate font-body italic"
                    style={{ fontSize: "11px", color: "var(--color-parchment-dim)" }}
                  >
                    {g.author}{g.publishedYear ? ` - ${g.publishedYear}` : ""}{g.pageCount ? ` - ${g.pageCount}pp` : ""}
                  </div>
                  <div className="mt-1 font-caveat text-brass-bright" style={{ fontSize: "13px" }}>
                    {expanded ? "tap to close" : "tap for details"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving || !!shelfStatus}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAdd(g);
                  }}
                  className="tap shrink-0 border border-brass px-3 py-2 font-body uppercase text-brass-bright disabled:opacity-50"
                  style={{ fontSize: "10px", letterSpacing: "2px" }}
                >
                  {saving ? "Saving" : shelfStatus ? statusLabel[shelfStatus] : "+ Pile"}
                </button>
              </div>
              {expanded && (
                <div className="mt-3 border-t border-brass/20 pt-3">
                  {g.description ? (
                    <p className="text-sm leading-relaxed text-parchment-dim">
                      {g.description}
                    </p>
                  ) : (
                    <p className="font-caveat text-parchment-dim" style={{ fontSize: "15px" }}>
                      No description yet. ISBN or exact title usually finds the cleanest edition.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 font-body uppercase text-parchment-dim" style={{ fontSize: "9px", letterSpacing: "1.5px" }}>
                    <span>{g.source}</span>
                    {g.language && <span>{g.language}</span>}
                    {g.isbn13 && <span>ISBN {g.isbn13}</span>}
                  </div>
                </div>
              )}
            </li>
          );
        })}

        {state.kind === "idle" && (
          <li className="text-center font-caveat text-parchment-dim" style={{ fontSize: "16px" }}>
            search by title, author, or ISBN.
          </li>
        )}
        {state.kind === "searching" && (
          <li className="text-center font-caveat text-parchment-dim" style={{ fontSize: "16px" }}>
            Searching the stacks&hellip;
          </li>
        )}
        {state.kind === "empty" && (
          <li className="text-center font-caveat text-parchment-dim" style={{ fontSize: "16px" }}>
            No matches. Try a different title.
          </li>
        )}
        {state.kind === "error" && (
          <li className="text-center font-caveat text-brass-bright" style={{ fontSize: "16px" }}>
            <div>
              {state.error === "rate-limit"
                ? "Too many searches. Take a breath, then try again."
                : state.error === "timeout"
                  ? "Google Books is slow tonight. Try once more."
                  : "Search is unavailable. Try again."}
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="tap mt-3 border border-brass px-4 py-2 font-body uppercase text-brass-bright"
              style={{ fontSize: "10px", letterSpacing: "2px" }}
            >
              Retry
            </button>
          </li>
        )}
      </ul>
      <div style={{ height: 30 }} />
    </div>
  );
}

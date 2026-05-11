"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { searchAction, addToPile } from "./actions";
import type { GoogleBook } from "@/lib/books/google-books";

type SearchState =
  | { kind: "idle" }
  | { kind: "searching"; query: string }
  | { kind: "empty"; query: string }
  | { kind: "results"; query: string; books: GoogleBook[] }
  | { kind: "error"; query: string; error: "api" | "rate-limit" | "timeout" | "unknown" };

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setState({ kind: "idle" });
      return;
    }
    const myId = ++requestIdRef.current;
    setState({ kind: "searching", query: trimmed });
    startTransition(async () => {
      const res = await searchAction(trimmed);
      // Stale response — ignore.
      if (myId !== requestIdRef.current) return;
      if (!res.ok) {
        setState({ kind: "error", query: trimmed, error: res.error });
        return;
      }
      if (res.books.length === 0) {
        setState({ kind: "empty", query: trimmed });
      } else {
        setState({ kind: "results", query: trimmed, books: res.books });
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

  const onAdd = (g: GoogleBook) => {
    startTransition(async () => {
      const res = await addToPile(g);
      if ("ok" in res) {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.add(g.googleBooksId);
          return next;
        });
        setNote(
          res.alreadyExisted
            ? `Already on your shelf (${res.status}).`
            : `${g.title} → the pile.`,
        );
      } else {
        setNote(res.error);
      }
    });
  };

  // Auto-dismiss the note after a beat so it doesn't pile up.
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3200);
    return () => clearTimeout(t);
  }, [note]);

  const results = state.kind === "results" ? state.books : [];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-6 pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/home"
          className="font-body uppercase tracking-[2px] text-brass-bright"
          style={{ fontSize: "12px" }}
        >
          ‹ back
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
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="title, author, or ISBN"
          className="mt-4 w-full border-b border-brass/30 bg-transparent pb-2 font-display text-parchment outline-none placeholder:text-parchment-dim/60"
          style={{ fontSize: "20px" }}
        />
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
        {results.map((g) => (
          <li
            key={g.googleBooksId}
            className="flex items-center gap-3 bg-mahogany-2/60 p-3 ring-1 ring-brass/20"
          >
            <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-mahogany-3">
              {g.thumbnail ? (
                <Image src={g.thumbnail} alt={g.title} fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-parchment" style={{ fontSize: "16px" }}>
                {g.title}
              </div>
              <div
                className="truncate font-body italic"
                style={{ fontSize: "11px", color: "var(--color-parchment-dim)" }}
              >
                {g.author}{g.publishedYear ? ` · ${g.publishedYear}` : ""}{g.pageCount ? ` · ${g.pageCount}pp` : ""}
              </div>
            </div>
            <button
              type="button"
              disabled={pending || addedIds.has(g.googleBooksId)}
              onClick={() => onAdd(g)}
              className="shrink-0 border border-brass px-3 py-2 font-body uppercase text-brass-bright disabled:opacity-50"
              style={{ fontSize: "10px", letterSpacing: "2px" }}
            >
              {addedIds.has(g.googleBooksId) ? "On pile" : "+ Pile"}
            </button>
          </li>
        ))}

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
              className="mt-3 border border-brass px-4 py-2 font-body uppercase text-brass-bright"
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

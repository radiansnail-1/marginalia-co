"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addBookToPile,
  startReadingBook,
  removeFromPile,
  rereadBook,
} from "./actions";

type UserBook = { id: string; status: "pile" | "reading" | "finished" | "abandoned" } | null;

export function ActionButtons({
  bookId,
  userBook,
}: {
  bookId: string;
  userBook: UserBook;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>, next?: string) =>
    startTransition(async () => {
      await fn();
      if (next) router.push(next);
      else router.refresh();
    });

  if (!userBook) {
    return (
      <div className="mt-6 flex gap-2.5">
        <button
          disabled={pending}
          onClick={() => run(() => addBookToPile(bookId), "/pile")}
          className="flex-1 border border-brass px-4 py-3 font-body uppercase text-brass-bright"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          + Add to pile
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => startReadingBook(bookId), `/reading?book=${bookId}`)}
          className="flex-1 bg-brass px-4 py-3 font-body uppercase text-mahogany"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          Start reading
        </button>
      </div>
    );
  }

  if (userBook.status === "pile") {
    return (
      <div className="mt-6 flex gap-2.5">
        <button
          disabled={pending}
          onClick={() => run(() => removeFromPile(userBook.id))}
          className="flex-1 border border-brass/40 px-4 py-3 font-body uppercase text-parchment-dim"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          Remove
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => startReadingBook(bookId), `/reading?book=${bookId}`)}
          className="flex-1 bg-brass px-4 py-3 font-body uppercase text-mahogany"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          Start reading
        </button>
      </div>
    );
  }

  if (userBook.status === "reading") {
    return (
      <div className="mt-6 flex gap-2.5">
        <Link
          href={`/reading?book=${bookId}`}
          className="flex-1 border border-brass px-4 py-3 text-center font-body uppercase text-brass-bright"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          Open session
        </Link>
        <Link
          href={`/reading?book=${bookId}`}
          className="flex-1 bg-sconce px-4 py-3 text-center font-body uppercase text-cream"
          style={{ fontSize: "11px", letterSpacing: "2.5px" }}
        >
          Finish
        </Link>
      </div>
    );
  }

  // finished or abandoned
  return (
    <div className="mt-6 flex gap-2.5">
      <button
        disabled={pending}
        onClick={() => run(() => rereadBook(bookId), `/reading?book=${bookId}`)}
        className="flex-1 border border-brass px-4 py-3 font-body uppercase text-brass-bright"
        style={{ fontSize: "11px", letterSpacing: "2.5px" }}
      >
        Re-read
      </button>
    </div>
  );
}

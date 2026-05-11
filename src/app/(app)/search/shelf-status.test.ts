import assert from "node:assert/strict";
import test from "node:test";
import { applyShelfStatuses } from "./shelf-status.ts";

test("marks already saved search results with their shelf status", () => {
  const books = [
    { googleBooksId: "gb-dune", title: "Dune" },
    { googleBooksId: "gb-hobbit", title: "The Hobbit" },
  ];

  const result = applyShelfStatuses(
    books,
    [
      { id: "book-1", google_books_id: "gb-dune" },
      { id: "book-2", google_books_id: "gb-other" },
    ],
    [{ book_id: "book-1", status: "pile" }],
  );

  assert.equal(result[0].shelfStatus, "pile");
  assert.equal(result[1].shelfStatus, null);
});

test("ignores stale or invalid shelf rows instead of marking the wrong book", () => {
  const result = applyShelfStatuses(
    [{ googleBooksId: "gb-dune", title: "Dune" }],
    [{ id: "book-1", google_books_id: "gb-dune" }],
    [
      { book_id: "missing-book", status: "pile" },
      { book_id: "book-1", status: "wishlist" },
    ],
  );

  assert.equal(result[0].shelfStatus, null);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKSHELF_ROWS,
  HOME_SHELF_VISIBLE_CAPACITY,
  bookshelfRowCapacity,
  distributeBooksIntoShelfRows,
  visibleShelfBooks,
} from "./bookshelf-layout.ts";

const books = (count: number) => Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));

test("home bookshelf has explicit mobile-safe visual capacity", () => {
  assert.equal(HOME_SHELF_VISIBLE_CAPACITY, 109);
  assert.deepEqual(
    Array.from({ length: BOOKSHELF_ROWS }, (_, row) => bookshelfRowCapacity(row)),
    [11, 11, 11, 19, 19, 19, 19],
  );
});

test("distributes 36 books without overfilling window-indented rows", () => {
  const rows = distributeBooksIntoShelfRows(books(36));
  assert.deepEqual(rows.map((row) => row.length), [11, 11, 11, 3, 0, 0, 0]);
});

test("fills exactly 109 visible spines", () => {
  const rows = distributeBooksIntoShelfRows(books(109));
  assert.deepEqual(rows.map((row) => row.length), [11, 11, 11, 19, 19, 19, 19]);
});

test("reports hidden shelf books beyond visual capacity", () => {
  assert.equal(visibleShelfBooks(books(110)).hiddenCount, 1);

  const fiveHundred = visibleShelfBooks(books(500));
  assert.equal(fiveHundred.visible.length, 109);
  assert.equal(fiveHundred.hiddenCount, 391);
});

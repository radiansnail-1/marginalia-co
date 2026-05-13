import assert from "node:assert/strict";
import test from "node:test";
import { isbnSearchQuery, normalizeIsbn } from "./isbn.ts";

test("normalizes valid ISBN-13 values for provider lookup", () => {
  assert.equal(normalizeIsbn("978-0-14-032872-1"), "9780140328721");
  assert.equal(isbnSearchQuery("978 0140328721"), "isbn:9780140328721");
});

test("accepts ISBN-10 check digits and rejects invalid scans", () => {
  assert.equal(normalizeIsbn("0-306-40615-2"), "0306406152");
  assert.equal(normalizeIsbn("0306406153"), null);
  assert.equal(isbnSearchQuery("not an isbn"), null);
});

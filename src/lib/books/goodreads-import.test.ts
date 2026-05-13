import assert from "node:assert/strict";
import test from "node:test";
import { mapGoodreadsStatus, parseGoodreadsCsv } from "./goodreads-import.ts";

test("maps Goodreads shelves to Marginalia statuses", () => {
  assert.equal(mapGoodreadsStatus("read"), "finished");
  assert.equal(mapGoodreadsStatus("currently-reading"), "reading");
  assert.equal(mapGoodreadsStatus("to-read"), "pile");
  assert.equal(mapGoodreadsStatus("dnf, fantasy"), "abandoned");
});

test("parses and dedupes Goodreads CSV rows", () => {
  const csv = [
    "Title,Author,ISBN13,Exclusive Shelf,My Rating,Date Read",
    '"Piranesi","Susanna Clarke","=""9780140328721""","read","5","2024/01/02"',
    '"Piranesi","Susanna Clarke","=""9780140328721""","read","5","2024/01/02"',
    '"Did Not Finish","A Writer","","dnf","2",""',
  ].join("\n");

  const parsed = parseGoodreadsCsv(csv);

  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.skipped, 1);
  assert.equal(parsed.counts.finished, 1);
  assert.equal(parsed.counts.abandoned, 1);
  assert.equal(parsed.rows[0].isbn13, "9780140328721");
  assert.equal(parsed.rows[0].rating, 5);
});

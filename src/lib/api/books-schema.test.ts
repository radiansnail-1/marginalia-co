import assert from "node:assert/strict";
import test from "node:test";
import { BookInputSchema } from "./books-schema.ts";

test("accepts half-star ratings as numbers and numeric strings", () => {
  const numeric = BookInputSchema.parse({
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    rating: 4.5,
  });
  assert.equal(numeric.rating, 4.5);

  const stringy = BookInputSchema.parse({
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    rating: "3.5",
  });
  assert.equal(stringy.rating, 3.5);
});

test("rejects ratings outside half-star increments", () => {
  assert.throws(() =>
    BookInputSchema.parse({
      title: "The Dispossessed",
      author: "Ursula K. Le Guin",
      rating: 4.25,
    }),
  );
});

test("supports review text and explicit rating or review clearing", () => {
  const parsed = BookInputSchema.parse({
    title: "Parable of the Sower",
    author: "Octavia E. Butler",
    rating: null,
    review: null,
  });

  assert.equal(parsed.rating, null);
  assert.equal(parsed.review, null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildUserBookPayload, chooseExistingBookCandidate } from "./book-upsert.ts";

test("chooses an existing plain title when incoming metadata includes a subtitle", () => {
  const match = chooseExistingBookCandidate(
    { title: "The Trading Game: A Confession", author: "Gary Stevenson" },
    [
      { title: "Humankind", author: "Rutger Bregman" },
      { title: "The Trading Game", author: "Gary Stevenson" },
    ],
  );

  assert.equal(match?.title, "The Trading Game");
});

test("does not match a similar title by a different author", () => {
  const match = chooseExistingBookCandidate(
    { title: "Humankind: A Hopeful History", author: "Rutger Bregman" },
    [
      { title: "Humankind", author: "Timothy Morton" },
    ],
  );

  assert.equal(match, null);
});

test("preserves omitted status, rating, and review when updating an existing shelf book", () => {
  const payload = buildUserBookPayload(
    "user-1",
    "book-1",
    { title: "AI Superpowers", author: "Kai-Fu Lee" },
    {
      id: "user-book-1",
      status: "finished",
      rating: 4.5,
      review: "Useful lens on China and Silicon Valley.",
      started_at: "2026-01-01T00:00:00.000Z",
      finished_at: "2026-01-02T00:00:00.000Z",
    },
    "2026-05-15T12:00:00.000Z",
  );

  assert.equal(payload.status, "finished");
  assert.equal(payload.rating, 4.5);
  assert.equal(payload.review, "Useful lens on China and Silicon Valley.");
});

test("supports explicit rating and review clearing", () => {
  const payload = buildUserBookPayload(
    "user-1",
    "book-1",
    { title: "Humankind", author: "Rutger Bregman", rating: null, review: null },
    {
      id: "user-book-1",
      status: "finished",
      rating: 4,
      review: "Old review.",
    },
    "2026-05-15T12:00:00.000Z",
  );

  assert.equal(payload.rating, null);
  assert.equal(payload.review, null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { selectFirstRecommendation } from "./first-recommendation.ts";

test("selectFirstRecommendation keeps the existing default first book", () => {
  const pick = selectFirstRecommendation({});

  assert.equal(pick.title, "The Dispossessed");
  assert.equal(pick.author, "Ursula K. Le Guin");
  assert.match(pick.reason, /sharper shelf/i);
  assert.match(pick.reason, /plot without consequence/i);
});

test("selectFirstRecommendation varies by onboarding answers", () => {
  const sharper = selectFirstRecommendation({
    intent: "Sharper",
    avoid: "Plot without consequence",
  });
  const steadier = selectFirstRecommendation({
    intent: "Steadier",
    avoid: "Over-neat productivity",
  });
  const stranger = selectFirstRecommendation({
    intent: "Stranger",
    avoid: "Academic fog",
  });
  const braver = selectFirstRecommendation({
    intent: "Braver",
    avoid: "400 pages of vague advice",
  });

  const titles = new Set([sharper.title, steadier.title, stranger.title, braver.title]);
  assert.deepEqual(titles, new Set([
    "The Dispossessed",
    "A Psalm for the Wild-Built",
    "Piranesi",
    "The Fire Next Time",
  ]));
});

test("selectFirstRecommendation returns a renderable book cover and reason", () => {
  const pick = selectFirstRecommendation({
    intent: "Steadier",
    avoid: "Academic fog",
  });

  assert.match(pick.coverUrl, /^https:\/\/covers\.openlibrary\.org\/b\/isbn\/.+-L\.jpg$/);
  assert.ok(pick.publishedYear > 1900);
  assert.match(pick.reason, /steadier shelf/i);
  assert.match(pick.reason, /academic fog/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import { cleanOnboardingAnswers } from "./onboarding.ts";

test("cleans onboarding answers with defaults", () => {
  assert.deepEqual(cleanOnboardingAnswers({}), {
    intent: "Sharper",
    avoid: "Plot without consequence",
    trustBook: "The Dispossessed",
  });
});

test("trims and bounds onboarding answers before storing", () => {
  const cleaned = cleanOnboardingAnswers({
    intent: `  ${"x".repeat(100)}  `,
    avoid: `  ${"y".repeat(140)}  `,
    trustBook: `  ${"z".repeat(140)}  `,
  });

  assert.equal(cleaned.intent.length, 80);
  assert.equal(cleaned.avoid.length, 120);
  assert.equal(cleaned.trustBook.length, 120);
  assert.equal(cleaned.intent.startsWith(" "), false);
});

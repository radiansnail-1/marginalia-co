import assert from "node:assert/strict";
import test from "node:test";
import { searchOpenLibraryBooks } from "./open-library.ts";

test("searchOpenLibraryBooks maps first_sentence into description", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      docs: [{
        key: "/works/OL123W",
        title: "A Wizard of Earthsea",
        author_name: ["Ursula K. Le Guin"],
        first_publish_year: 1968,
        isbn: ["9780547773742"],
        first_sentence: ["Ged was the greatest sorcerer in all Earthsea."],
        subject: ["Fantasy"],
        language: ["eng"],
      }],
    }), { status: 200 })) as typeof fetch;

  try {
    const books = await searchOpenLibraryBooks("earthsea", 1);
    assert.equal(books[0].description, "Ged was the greatest sorcerer in all Earthsea.");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

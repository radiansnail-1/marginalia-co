import assert from "node:assert/strict";
import test from "node:test";
import { API_REFERENCE } from "./reference.ts";

test("machine-readable API reference surfaces reviews and half-star ratings", () => {
  const booksGet = API_REFERENCE.endpoints.find((endpoint) => endpoint.method === "GET" && endpoint.path === "/api/v1/books");
  const booksPost = API_REFERENCE.endpoints.find((endpoint) => endpoint.method === "POST" && endpoint.path === "/api/v1/books");

  assert.ok(booksGet);
  assert.match(booksGet.returns, /review/);

  assert.ok(booksPost);
  assert.equal(booksPost.body.review.includes("4000"), true);
  assert.match(booksPost.body.rating, /0\.5/);
  assert.match(booksPost.returns, /preserved/);
  assert.equal(API_REFERENCE.notes.some((note) => note.includes("Reviews are supported")), true);
});

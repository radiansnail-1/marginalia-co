import assert from "node:assert/strict";
import test from "node:test";
import { GoogleBooksApiError, searchBooks } from "./google-books.ts";

test("searchBooks aborts with a timeout error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    const signal = init?.signal as AbortSignal | undefined;
    return await new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  }) as typeof fetch;

  try {
    await assert.rejects(
      () => searchBooks("left hand of darkness", 1, { timeoutMs: 1 }),
      (err) => err instanceof GoogleBooksApiError && err.status === 408,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("searchBooks respects a parent abort signal", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    const signal = init?.signal as AbortSignal | undefined;
    return await new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  }) as typeof fetch;

  try {
    const controller = new AbortController();
    const promise = searchBooks("piranesi", 1, { signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
    await assert.rejects(
      () => promise,
      (err) => err instanceof GoogleBooksApiError && err.status === 408,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

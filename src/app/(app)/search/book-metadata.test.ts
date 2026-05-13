import assert from "node:assert/strict";
import test from "node:test";
import { missingBookMetadataPatch } from "./book-metadata.ts";

const searchBook = {
  googleBooksId: "gb-project-hail-mary",
  openLibraryId: "ol-project-hail-mary",
  title: "Project Hail Mary",
  author: "Andy Weir",
  isbn13: "9780593135211",
  description: "A stranded astronaut has to solve a civilization-scale science problem.",
  language: "en",
  publishedYear: 2021,
  pageCount: 497,
  subjects: ["Science fiction"],
  thumbnail: "https://example.com/project-hail-mary.jpg",
};

test("missingBookMetadataPatch fills stale catalog metadata from a search result", () => {
  const patch = missingBookMetadataPatch(
    {
      google_books_id: null,
      open_library_id: null,
      isbn_13: null,
      cover_url: null,
      description: null,
      page_count: null,
      published_year: null,
      subjects: [],
    },
    searchBook,
  );

  assert.equal(patch.google_books_id, "gb-project-hail-mary");
  assert.equal(patch.open_library_id, "ol-project-hail-mary");
  assert.equal(patch.isbn_13, "9780593135211");
  assert.equal(patch.cover_url, "https://example.com/project-hail-mary.jpg");
  assert.equal(patch.description, searchBook.description);
  assert.equal(patch.page_count, 497);
  assert.equal(patch.published_year, 2021);
  assert.deepEqual(patch.subjects, ["Science fiction"]);
  assert.equal(patch.embedding, null);
  assert.equal(patch.embedding_text_hash, null);
});

test("missingBookMetadataPatch does not overwrite existing catalog metadata", () => {
  const patch = missingBookMetadataPatch(
    {
      google_books_id: "existing-google",
      open_library_id: "existing-open-library",
      isbn_13: "9780000000000",
      cover_url: "https://example.com/existing.jpg",
      description: "Existing description.",
      page_count: 123,
      published_year: 1999,
      subjects: ["Existing subject"],
    },
    searchBook,
  );

  assert.deepEqual(patch, {});
});

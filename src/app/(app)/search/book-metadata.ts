import type { GoogleBook } from "@/lib/books/google-books";

export type ExistingBookMetadata = {
  google_books_id?: string | null;
  open_library_id?: string | null;
  isbn_13?: string | null;
  cover_url?: string | null;
  description?: string | null;
  page_count?: number | null;
  published_year?: number | null;
  subjects?: string[] | null;
};

export function missingBookMetadataPatch(existing: ExistingBookMetadata, book: GoogleBook) {
  const patch: Record<string, unknown> = {};

  if (!existing.google_books_id && book.googleBooksId) patch.google_books_id = book.googleBooksId;
  if (!existing.open_library_id && book.openLibraryId) patch.open_library_id = book.openLibraryId;
  if (!existing.isbn_13 && book.isbn13) patch.isbn_13 = book.isbn13;
  if (!existing.cover_url && book.thumbnail) patch.cover_url = book.thumbnail;
  if (!existing.page_count && book.pageCount) patch.page_count = book.pageCount;
  if (!existing.published_year && book.publishedYear) patch.published_year = book.publishedYear;
  if ((!Array.isArray(existing.subjects) || existing.subjects.length === 0) && book.subjects.length > 0) {
    patch.subjects = book.subjects;
  }

  if (!existing.description && book.description) {
    patch.description = book.description;
    patch.embedding = null;
    patch.embedding_model = null;
    patch.embedding_dimensions = null;
    patch.embedding_text_hash = null;
    patch.embedded_at = null;
  }

  return patch;
}

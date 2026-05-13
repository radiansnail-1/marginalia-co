export type UserBookStatus = "pile" | "reading" | "finished" | "abandoned";

export type ShelfTaggedBook<T extends { googleBooksId?: string | null; openLibraryId?: string | null; isbn13?: string | null; catalogBookId?: string | null }> = T & {
  shelfStatus: UserBookStatus | null;
};

type CatalogRow = {
  id: string;
  google_books_id: string | null;
  open_library_id?: string | null;
  isbn_13?: string | null;
};

type ShelfRow = {
  book_id: string;
  status: string;
};

const STATUSES = new Set<UserBookStatus>(["pile", "reading", "finished", "abandoned"]);

function isUserBookStatus(status: string): status is UserBookStatus {
  return STATUSES.has(status as UserBookStatus);
}

export function applyShelfStatuses<T extends { googleBooksId?: string | null; openLibraryId?: string | null; isbn13?: string | null; catalogBookId?: string | null }>(
  books: T[],
  catalogRows: CatalogRow[],
  shelfRows: ShelfRow[],
): Array<ShelfTaggedBook<T>> {
  const statusByBookId = new Map<string, UserBookStatus>();
  const googleIdByBookId = new Map(
    catalogRows
      .filter((row) => row.google_books_id)
      .map((row) => [row.id, row.google_books_id as string]),
  );
  const openLibraryIdByBookId = new Map(
    catalogRows
      .filter((row) => row.open_library_id)
      .map((row) => [row.id, row.open_library_id as string]),
  );
  const isbnByBookId = new Map(
    catalogRows
      .filter((row) => row.isbn_13)
      .map((row) => [row.id, row.isbn_13 as string]),
  );
  const statusByGoogleId = new Map<string, UserBookStatus>();
  const statusByOpenLibraryId = new Map<string, UserBookStatus>();
  const statusByIsbn = new Map<string, UserBookStatus>();

  for (const row of shelfRows) {
    if (!isUserBookStatus(row.status)) continue;
    statusByBookId.set(row.book_id, row.status);
    const googleId = googleIdByBookId.get(row.book_id);
    if (googleId) statusByGoogleId.set(googleId, row.status);
    const openLibraryId = openLibraryIdByBookId.get(row.book_id);
    if (openLibraryId) statusByOpenLibraryId.set(openLibraryId, row.status);
    const isbn = isbnByBookId.get(row.book_id);
    if (isbn) statusByIsbn.set(isbn, row.status);
  }

  return books.map((book) => ({
    ...book,
    shelfStatus:
      (book.catalogBookId ? statusByBookId.get(book.catalogBookId) : null) ??
      (book.googleBooksId ? statusByGoogleId.get(book.googleBooksId) : null) ??
      (book.openLibraryId ? statusByOpenLibraryId.get(book.openLibraryId) : null) ??
      (book.isbn13 ? statusByIsbn.get(book.isbn13) : null) ??
      null,
  }));
}

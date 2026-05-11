export type UserBookStatus = "pile" | "reading" | "finished" | "abandoned";

export type ShelfTaggedBook<T extends { googleBooksId: string }> = T & {
  shelfStatus: UserBookStatus | null;
};

type CatalogRow = {
  id: string;
  google_books_id: string | null;
};

type ShelfRow = {
  book_id: string;
  status: string;
};

const STATUSES = new Set<UserBookStatus>(["pile", "reading", "finished", "abandoned"]);

function isUserBookStatus(status: string): status is UserBookStatus {
  return STATUSES.has(status as UserBookStatus);
}

export function applyShelfStatuses<T extends { googleBooksId: string }>(
  books: T[],
  catalogRows: CatalogRow[],
  shelfRows: ShelfRow[],
): Array<ShelfTaggedBook<T>> {
  const googleIdByBookId = new Map(
    catalogRows
      .filter((row) => row.google_books_id)
      .map((row) => [row.id, row.google_books_id as string]),
  );
  const statusByGoogleId = new Map<string, UserBookStatus>();

  for (const row of shelfRows) {
    if (!isUserBookStatus(row.status)) continue;
    const googleId = googleIdByBookId.get(row.book_id);
    if (googleId) statusByGoogleId.set(googleId, row.status);
  }

  return books.map((book) => ({
    ...book,
    shelfStatus: statusByGoogleId.get(book.googleBooksId) ?? null,
  }));
}

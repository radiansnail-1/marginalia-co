export const BOOKSHELF_ROWS = 7;

export function bookshelfRowCapacity(row: number): number {
  return row < 3 ? 11 : 19;
}

export const HOME_SHELF_VISIBLE_CAPACITY = Array.from({ length: BOOKSHELF_ROWS }, (_, row) =>
  bookshelfRowCapacity(row),
).reduce((sum, capacity) => sum + capacity, 0);

export function distributeBooksIntoShelfRows<T>(books: T[]): T[][] {
  const rowBooks: T[][] = Array.from({ length: BOOKSHELF_ROWS }, () => []);
  let row = 0;

  for (const book of books.slice(0, HOME_SHELF_VISIBLE_CAPACITY)) {
    if (row >= BOOKSHELF_ROWS) break;
    rowBooks[row].push(book);
    if (rowBooks[row].length >= bookshelfRowCapacity(row)) row += 1;
  }

  return rowBooks;
}

export function visibleShelfBooks<T>(books: T[]): {
  visible: T[];
  hiddenCount: number;
} {
  const visible = books.slice(0, HOME_SHELF_VISIBLE_CAPACITY);
  return {
    visible,
    hiddenCount: Math.max(0, books.length - visible.length),
  };
}

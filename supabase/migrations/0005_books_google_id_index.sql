-- Marginalia & Co. — performance index for the addToPile lookup path.
-- `addToPile` and `POST /api/v1/books` both look up the shared books catalog
-- by `google_books_id`. Without an index this was a full table scan.

create unique index if not exists books_google_books_id_unique
  on public.books (google_books_id)
  where google_books_id is not null;

-- Add freeform review text to user_books so finishing a book can capture
-- a written note alongside the numeric rating.

alter table public.user_books
  add column if not exists review text;

create index if not exists user_books_review_not_null_idx
  on public.user_books (book_id)
  where review is not null;

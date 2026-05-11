-- PostgREST/Supabase upsert with `onConflict: "google_books_id"` needs a
-- non-partial unique index to match the conflict target. PostgreSQL unique
-- indexes still allow multiple NULL values, so books without a Google Books ID
-- remain insertable while real Google IDs stay deduped.
drop index if exists public.books_google_books_id_unique;

create unique index if not exists books_google_books_id_unique
  on public.books (google_books_id);

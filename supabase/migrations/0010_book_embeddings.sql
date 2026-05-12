-- Cache compact semantic embeddings on shared catalog books.
-- Stored as jsonb so this first pass avoids a pgvector dependency while
-- the app is still reranking small candidate sets in TypeScript.

alter table public.books
  add column if not exists embedding jsonb,
  add column if not exists embedding_model text,
  add column if not exists embedding_dimensions int,
  add column if not exists embedding_text_hash text,
  add column if not exists embedded_at timestamptz;

create index if not exists books_embedding_model_idx
  on public.books (embedding_model, embedding_dimensions)
  where embedding is not null;

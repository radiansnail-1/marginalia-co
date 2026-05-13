-- Private semantic summaries for recommendation embeddings.
-- Unlike public descriptions, these are not shown in the UI and can prioritize
-- themes, tone, setting, genre, and subject matter for retrieval quality.

alter table public.books
  add column if not exists embedding_summary text,
  add column if not exists embedding_summary_confidence text,
  add column if not exists embedding_summary_model text,
  add column if not exists embedding_summary_updated_at timestamptz;

comment on column public.books.embedding_summary is
  'Internal semantic summary used for embeddings and recommendations; not intended for display.';

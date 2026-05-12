-- Store short public book blurbs for better cached embedding quality.
alter table public.books
  add column if not exists description text;

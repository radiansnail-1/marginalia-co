-- Private recommendation feedback and cached taste profiles for the Librarian.
-- These tables are additive: the app still falls back to request-time scoring if
-- this migration has not been applied yet.

do $$ begin
  create type recommendation_event_type as enum ('shown', 'save', 'not_for_me', 'open');
exception when duplicate_object then null; end $$;

create table if not exists public.recommendation_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  event_type recommendation_event_type not null,
  mood text,
  rank int,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_events_user_created_idx
  on public.recommendation_events (user_id, created_at desc);

create index if not exists recommendation_events_user_book_idx
  on public.recommendation_events (user_id, book_id, created_at desc)
  where book_id is not null;

create table if not exists public.user_taste_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  liked_embedding jsonb,
  disliked_embedding jsonb,
  embedding_model text not null,
  embedding_dimensions int not null,
  input_hash text not null,
  positive_count int not null default 0,
  negative_count int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists user_taste_profiles_model_idx
  on public.user_taste_profiles (embedding_model, embedding_dimensions);

alter table public.recommendation_events enable row level security;
alter table public.user_taste_profiles enable row level security;

drop policy if exists "recommendation_events self read" on public.recommendation_events;
create policy "recommendation_events self read" on public.recommendation_events
  for select using (auth.uid() = user_id);

drop policy if exists "recommendation_events self insert" on public.recommendation_events;
create policy "recommendation_events self insert" on public.recommendation_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_taste_profiles self read" on public.user_taste_profiles;
create policy "user_taste_profiles self read" on public.user_taste_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "user_taste_profiles self upsert" on public.user_taste_profiles;
create policy "user_taste_profiles self upsert" on public.user_taste_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_taste_profiles self update" on public.user_taste_profiles;
create policy "user_taste_profiles self update" on public.user_taste_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

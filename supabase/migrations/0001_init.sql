-- Marginalia & Co. — initial schema
-- Run inside the project's Supabase SQL editor or via `supabase db push`.

create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  reading_goal int not null default 60,
  created_at timestamptz not null default now()
);

-- Shared book catalog
create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  open_library_id text unique,
  google_books_id text,
  isbn_13 text,
  title text not null,
  author text not null,
  cover_url text,
  dominant_color text,
  page_count int,
  published_year int,
  subjects text[] default array[]::text[],
  added_at timestamptz not null default now()
);

create index if not exists books_isbn_idx on public.books (isbn_13);
create index if not exists books_subjects_gin on public.books using gin (subjects);

-- user × book bridge
do $$ begin
  create type user_book_status as enum ('pile','reading','finished','abandoned');
exception when duplicate_object then null; end $$;

create table if not exists public.user_books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  status user_book_status not null default 'pile',
  rating int check (rating between 1 and 5),
  current_page int,
  added_to_pile_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  added_from text,
  unique (user_id, book_id)
);

create index if not exists user_books_status_idx on public.user_books (user_id, status);

-- Reading sessions (hourglass)
create table if not exists public.reading_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_book_id uuid not null references public.user_books(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int,
  pages_read int,
  starting_page int,
  ending_page int
);

create index if not exists reading_sessions_user_book_idx on public.reading_sessions (user_book_id);

-- Hand-curated weekly Librarian pick (v0.1: manual)
create table if not exists public.librarian_picks (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references public.books(id),
  week_of date not null,
  blurb text,
  active boolean not null default true
);

create index if not exists librarian_picks_active_idx on public.librarian_picks (active, week_of desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.books enable row level security;
alter table public.librarian_picks enable row level security;

-- Profiles: each user can read/update own row
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- user_books: own rows only
drop policy if exists "user_books self all" on public.user_books;
create policy "user_books self all" on public.user_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reading_sessions: own via user_books
drop policy if exists "reading_sessions self all" on public.reading_sessions;
create policy "reading_sessions self all" on public.reading_sessions for all
  using (exists (select 1 from public.user_books ub where ub.id = user_book_id and ub.user_id = auth.uid()))
  with check (exists (select 1 from public.user_books ub where ub.id = user_book_id and ub.user_id = auth.uid()));

-- books: world-readable, inserts via authenticated users (catalog is shared)
drop policy if exists "books world read" on public.books;
create policy "books world read" on public.books for select using (true);

drop policy if exists "books authed insert" on public.books;
create policy "books authed insert" on public.books for insert to authenticated with check (true);

-- librarian_picks: world-readable, no client-side writes
drop policy if exists "librarian_picks world read" on public.librarian_picks;
create policy "librarian_picks world read" on public.librarian_picks for select using (active);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Marginalia & Co. — personal access tokens for the external integration API.
-- Each row stores a *hashed* token. The plaintext token is shown to the user
-- exactly once at creation time and then discarded. Lookups happen via the
-- service-role client in the API routes, so RLS only governs UI-side reads.

create extension if not exists "pgcrypto";

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'untitled token',
  token_hash text not null unique,
  token_prefix text not null,                   -- first 8 chars, e.g. 'mg_abcd1' for display only
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_tokens_user_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;

drop policy if exists "api_tokens self read" on public.api_tokens;
create policy "api_tokens self read" on public.api_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "api_tokens self insert" on public.api_tokens;
create policy "api_tokens self insert" on public.api_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "api_tokens self update" on public.api_tokens;
create policy "api_tokens self update" on public.api_tokens
  for update using (auth.uid() = user_id);

drop policy if exists "api_tokens self delete" on public.api_tokens;
create policy "api_tokens self delete" on public.api_tokens
  for delete using (auth.uid() = user_id);

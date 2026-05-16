-- Onboarding, referral, and prompt-suppression state for the first-value flow.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb,
  add column if not exists plus_prompt_seen_at timestamptz,
  add column if not exists referral_prompt_seen_at timestamptz,
  add column if not exists rating_prompt_seen_at timestamptz,
  add column if not exists rating_prompt_claimed_at timestamptz,
  add column if not exists rating_prompt_dismissed_at timestamptz;

create table if not exists public.referral_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id),
  constraint referral_codes_code_shape check (code ~ '^[A-Z0-9][A-Z0-9-]{3,31}$')
);

do $$ begin
  create type referral_event_status as enum ('pending','qualified','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.referral_events (
  id uuid primary key default uuid_generate_v4(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null references public.referral_codes(code) on delete restrict,
  status referral_event_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  unique (referred_user_id)
);

create index if not exists referral_events_referrer_status_idx
  on public.referral_events (referrer_user_id, status, created_at desc);

alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;

drop policy if exists "referral_codes self read" on public.referral_codes;
create policy "referral_codes self read" on public.referral_codes
  for select using (auth.uid() = user_id);

drop policy if exists "referral_codes self insert" on public.referral_codes;
create policy "referral_codes self insert" on public.referral_codes
  for insert with check (auth.uid() = user_id);

drop policy if exists "referral_codes self update" on public.referral_codes;
create policy "referral_codes self update" on public.referral_codes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "referral_events participant read" on public.referral_events;
create policy "referral_events participant read" on public.referral_events
  for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);


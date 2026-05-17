-- Permanent promo entitlement state.

alter table public.profiles
  add column if not exists plus_unlocked_at timestamptz,
  add column if not exists plus_access_source text,
  add column if not exists plus_promo_code text;

create index if not exists profiles_plus_promo_code_idx
  on public.profiles (plus_promo_code)
  where plus_promo_code is not null;

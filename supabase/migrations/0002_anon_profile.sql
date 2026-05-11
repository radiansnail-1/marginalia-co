-- Update auto-profile trigger to handle anonymous sign-ins (no email).
-- Re-run-safe: create or replace.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(new.email, '@', 1), ''),
      'Guest reader'
    )
  );
  return new;
end;
$$;

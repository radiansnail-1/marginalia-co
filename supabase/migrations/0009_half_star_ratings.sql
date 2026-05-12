-- Allow half-star ratings while keeping the existing 0.5-5 scale explicit.

alter table public.user_books
  alter column rating type numeric(2,1) using rating::numeric(2,1);

alter table public.user_books
  drop constraint if exists user_books_rating_check;

alter table public.user_books
  add constraint user_books_rating_check
  check (
    rating is null
    or (
      rating >= 0.5
      and rating <= 5
      and rating * 2 = floor(rating * 2)
    )
  );

-- Marginalia & Co. - shared book rating aggregates.
-- Individual ratings stay on user_books. These columns give the catalog a
-- durable aggregate signal for recommendations, sorting, and future ML jobs.

alter table public.books
  add column if not exists rating_count int not null default 0,
  add column if not exists average_rating numeric(3,2);

create or replace function public.refresh_book_rating_aggregate(target_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.books b
  set
    rating_count = agg.rating_count,
    average_rating = agg.average_rating
  from (
    select
      count(*)::int as rating_count,
      round(avg(rating)::numeric, 2)::numeric(3,2) as average_rating
    from public.user_books
    where book_id = target_book_id
      and rating is not null
  ) agg
  where b.id = target_book_id;

  update public.books
  set average_rating = null
  where id = target_book_id
    and rating_count = 0;
end;
$$;

create or replace function public.refresh_book_rating_aggregate_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_book_rating_aggregate(old.book_id);
    return old;
  end if;

  perform public.refresh_book_rating_aggregate(new.book_id);

  if tg_op = 'UPDATE' and old.book_id is distinct from new.book_id then
    perform public.refresh_book_rating_aggregate(old.book_id);
  end if;

  return new;
end;
$$;

drop trigger if exists user_books_rating_aggregate on public.user_books;
create trigger user_books_rating_aggregate
  after insert or update of rating, book_id or delete on public.user_books
  for each row execute function public.refresh_book_rating_aggregate_trigger();

do $$
declare
  book record;
begin
  for book in select id from public.books loop
    perform public.refresh_book_rating_aggregate(book.id);
  end loop;
end;
$$;

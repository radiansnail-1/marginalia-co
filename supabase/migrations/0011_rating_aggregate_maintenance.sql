-- Keep shared rating aggregates cheap and self-healing.
--
-- The existing trigger in 0007 keeps `books.average_rating` and
-- `books.rating_count` fresh after each rating write. This index makes that
-- per-book recount fast as ratings grow, and the weekly cron job is a repair
-- sweep in case imports or manual DB edits ever bypass the trigger.

create index if not exists user_books_book_rating_idx
  on public.user_books (book_id, rating)
  where rating is not null;

create or replace function public.refresh_all_book_rating_aggregates()
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
      books.id,
      count(user_books.rating)::int as rating_count,
      round(avg(user_books.rating)::numeric, 2)::numeric(3,2) as average_rating
    from public.books
    left join public.user_books
      on user_books.book_id = books.id
      and user_books.rating is not null
    group by books.id
  ) agg
  where b.id = agg.id;
end;
$$;

create extension if not exists pg_cron with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'refresh-book-rating-aggregates-weekly'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'refresh-book-rating-aggregates-weekly',
    '17 3 * * 0',
    'select public.refresh_all_book_rating_aggregates();'
  );
end;
$$;

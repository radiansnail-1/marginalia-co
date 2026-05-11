# Learnings

- **Search must include shelf state** - Google Books results are not enough for the UI. Search must join returned Google IDs against `books` and `user_books` so repeat searches can show `On pile`, `Reading`, `Finished`, or `Set aside`.
- **Supabase upsert conflict targets need matching unique indexes** - `upsert(... onConflict: "google_books_id")` failed because the existing index was partial. Use a normal unique index on nullable `google_books_id`; PostgreSQL still allows multiple nulls.
- **Pile latency came from server route work** - Pile was waiting on verified auth plus two Supabase reads. Using `getClaims()` plus one combined `user_books` query lowered local mobile navigation from about 3.7s to about 0.8s in dev timing.
- **Fullscreen is install-context dependent** - `display: fullscreen` and `viewport-fit=cover` help installed PWA/TWA shells, but normal browser tabs cannot hide OS status/navigation bars. Android TWA may require native immersive mode.

**Last updated:** 2026-05-11

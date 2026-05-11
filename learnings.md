# Learnings

- **Search must include shelf state** - Google Books results are not enough for the UI. Search must join returned Google IDs against `books` and `user_books` so repeat searches can show `On pile`, `Reading`, `Finished`, or `Set aside`.
- **Avoid Supabase upsert when production indexes may lag** - `upsert(... onConflict: "google_books_id")` requires a matching non-partial unique index. The safer live-compatible path is insert plus a `23505` duplicate fallback lookup, with the full unique migration kept as cleanup.
- **Pile latency came from server route work** - Pile was waiting on verified auth plus two Supabase reads. Using `getClaims()` plus one combined `user_books` query lowered local mobile navigation from about 3.7s to about 0.8s in dev timing.
- **PWA service workers can poison local QA ports** - `http://127.0.0.1:3000/home` showed a stale unrelated offline page during verification. Use a fresh dev port when local PWA/browser state looks unrelated to the app.
- **Fullscreen is install-context dependent** - `display: fullscreen` and `viewport-fit=cover` help installed PWA/TWA shells, but normal browser tabs cannot hide OS status/navigation bars. Android TWA may require native immersive mode.

**Last updated:** 2026-05-11

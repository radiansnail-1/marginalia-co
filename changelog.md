# Changelog

## 2026-05-12

- Addressed pre-merge browser comments: removed the home profile shortcut, made the add-book `+` clearer, reduced/smoothed shelf spines, replaced cover grid shelf cards with horizontal text rows, added local shelf search, removed `from api` labels from pile rows, and changed the room window/note to follow device time.
- Added half-star rating support in review/edit flows, API validation, reading actions, and migration `0009_half_star_ratings.sql`.
- Added public legal/OSS surfaces: expanded privacy policy, terms page, license page, root `LICENSE`, `COMMUNITY.md`, README license note, and proxy allowlist for `/terms` and `/license`.
- Updated affiliate documentation and buying-link surfaces for Bookshop, Shopee, Lazada, Amazon, Kobo, and Audible/Awin setup questions.
- Added hybrid Librarian recommendations: cached embeddings, provider-agnostic embedding config, OpenAI-compatible endpoint support, user rating/review weighting, low-rating/abandoned negative signal, global rating quality boost, metadata fallback, capped runtime embedding, and migration `0010_book_embeddings.sql`.
- Added `scripts/preembed-books.mjs` plus `npm run preembed:books` for pre-launch catalog embedding. Dry-run now works without an embedding key and exits cleanly on Windows.
- User reported Supabase migration `0010_book_embeddings.sql` is applied and deployment OpenAI env vars are set. Verified dry-run can see embedding columns and reports 60 books needing vectors out of 60 scanned.
- Added migration `0011_rating_aggregate_maintenance.sql` with a partial `(book_id, rating)` index, a full aggregate repair function, and a weekly `pg_cron` repair schedule.
- Verification passed: `npm run lint`, `npx tsc --noEmit`, and pre-embed dry-run. Earlier local browser QA passed against `http://localhost:3000`.

## 2026-05-11

- Synced 48 books from the Obsidian vault into the live API via `sync_books.py`: 12 pile, 2 reading, 34 finished.
- Applied migration 0007 for rating aggregates to prod Supabase.
- Shipped PR #6 UI polish: reviews migration 0008, inline review editor, search dedup, reading carousel, cover fallback endpoint, tap-feel utility, icon tabbar, mobile fullscreen metadata, and Google/OpenLibrary preconnects.
- QA'd live public surfaces and protected redirects, made `/privacy` public, and documented remaining Android TWA asset-links work.
- Pivoted signup away from email confirmation because Supabase default mail and Resend sandboxing were not production-ready without a verified domain.

**Last updated:** 2026-05-12

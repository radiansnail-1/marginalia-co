# Changelog

## 2026-05-13

- Completed the Codex-authored embedding summary loop for the 10k scanned catalog set. Workers exported missing rows with `npm run summarize:export`, authored JSONL summaries under `tmp/embedding-summary-updates/`, and applied them with `npm run summarize:apply -- --model=gpt-5.5-codex-agent`.
- Did not run `npm run summarize:embeddings`; the user explicitly wanted Codex agents to author summaries before the embedding API run.
- Added `supabase/migrations/0014_book_embedding_summaries.sql` for `books.embedding_summary`, confidence, model, and update timestamp fields.
- Updated embedding and recommendation code so `embedding_summary` contributes to `bookEmbeddingText` and is threaded through shelf rows, catalog candidates, cache hydration, recommendation signals, and hash checks.
- Updated `scripts/preembed-books.mjs` and `scripts/verify-brain-readiness.mjs` to paginate with `.range(...)`, scan in deterministic `added_at`/`id` order, include `embedding_summary` in embedding text/hash checks, and report missing embedding summaries.
- Fixed preembedding freshness logic so a row only counts as current when the actual embedding vector exists, not just when the hash matches.
- Added retry/backoff handling for 429/5xx embedding failures; the first real preembed run hit a 429 after 8,384 of 10,000 rows, then completed after the retry/freshness fixes.
- Verified final brain readiness with `npm run verify:brain -- --limit=10000`: scanned 10,000; embeddings current 10,000; stale 0; present 10,000; missing embedding summaries 0; missing descriptions 4,300; missing covers 9,846; user shelf rows 565; learning tables ok.
- Verified the local branch with `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`; all passed. Tests still print non-fatal Node ESM typeless-package warnings.
- Browser-smoked local desktop routes on `http://localhost:3000`: `/home`, `/librarian` mood pick and reveal more, `/search` for `left hand of darkness`, ISBN camera-unavailable fallback, `/profile`, `/reading`, `/pile`, and `/shelf`; no browser console errors were observed.
- Left mutation QA undone on purpose: Goodreads commit, DNF clicks, and Librarian save/not-for-me/open were not clicked against real data. True mobile viewport QA also remains pending because the available browser surface did not expose viewport resizing.
- Left `tmp/embedding-summary-updates/` in place as the audit trail for authored summaries. No commit, push, deploy, browser-mobile pass, or TWA final verification was performed.

## 2026-05-12

- Treated `0013_librarian_learning.sql` as already applied per user update and updated the release plan accordingly.
- Fixed the requested DNF-from-pile path by wiring the existing `abandonFromPile` action into `PileRow`, then revalidating `/shelf` after DNF from pile or reading.
- Clarified Goodreads CSV preview copy so exports over the 2,000-row cap show importable rows and over-limit skips before commit.
- Browser-checked the unauthenticated sign-in shell at desktop `1440x900` and mobile `390x844`; no console errors found. Authenticated search/import/DNF/Librarian browser QA remains blocked without a test session or approval to create one.
- Documented the Play Console path for the production SHA-256 app signing certificate fingerprint and kept production `assetlinks.json` blocked until the final fingerprint exists.
- Added the staged ship plan: PR 1 TWA tooling/docs, PR 2 search/import/DNF safety fixes, PR 3 Librarian diagnostics/brain readiness, PR 4 concierge/recommendation learning after `0013`.
- Added a release checklist for `enrich:descriptions` -> `preembed:books` -> `verify:brain` -> migration confirmation -> browser QA.
- Created AgentMail QA account `gentleside478@agentmail.to`, seeded it with pile/reading rows, and used it for protected-route QA.
- Seeded the AgentMail QA account with 36 finished books to reproduce the Xiaomi home-shelf overflow, then fixed `src/components/room/bookshelf.tsx` with row-specific capacities and row clipping. Browser QA at 360x800 showed books staying inside the shelf and no console errors.
- Ran CEO shelf-scale review: current home shelf can show 109 spines, so 100 books fits visually, 500 books silently truncates the room preview, and `/shelf` needs a progressive library-index mode for high-volume users.
- Ran eng review for shelf scale, then implemented the first slice: extracted `src/components/room/bookshelf-layout.ts`, limited `/home` to 109 visible books plus a count-only total, added `109 here +391 stacked` overflow copy, and covered 36/109/110/500-book cases in `bookshelf-layout.test.ts`.
- Seeded the AgentMail QA account up to 500 finished books and browser-checked `/home` at 360x800. The final visible state showed 109 spines and the overflow hint without clipping; the in-app screenshot surface still tiles viewports.
- Fixed `/pile` auth loading by replacing `supabase.auth.getClaims()` with the shared `getCurrentUser()` path; authenticated shell render now includes seeded pile and reading rows.
- Browser route QA covered `/home`, `/search`, `/profile`, `/librarian`, `/reading`, and `/shelf` on mobile with no console errors. Browser click/type/screenshot operations timed out in the in-app browser runtime, so search entry, CSV upload, and button-click transitions still need a manual or Playwright pass.
- Implemented the dirty-branch release plan locally without touching the user's running enrichment job.
- Used exactly one subagent for the UI/search/import/DNF lane while the main agent handled Librarian/data/TWA readiness work.
- Added `scripts/verify-brain-readiness.mjs` and `npm run verify:brain` for post-enrichment checks: current/stale embeddings, missing descriptions/covers, and `recommendation_events` / `user_taste_profiles` availability.
- Added Librarian recommendation diagnostics for shelf books, embedded shelf books, recommendation signals, profile cache hit, candidate query count, catalog candidates, Google candidates, cache hydration, runtime embeddings, ranked candidates, and fallback reason.
- Updated Google Books search to accept timeout and parent abort options, then added `src/lib/books/google-books.test.ts` coverage for timeout and parent abort behavior.
- Improved search so catalog/Open Library results can still return when Google fails, with partial-result metadata surfaced in the search UI.
- Improved Goodreads import commit behavior: capped importable rows at 2000, reports skipped-over-limit rows, and resolves Google metadata for newly inserted imported books.
- Fixed `endSession` so reading sessions verify the signed-in user owns the backing `user_books` row before updating duration/end time.
- Removed an invalid `books.language` insert from Goodreads import after confirming no migration defines that column.
- Verified latest local changes with `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node --check scripts/verify-brain-readiness.mjs`, and `git diff --check`.
- Did not run `npm run verify:brain`, real preembed, commit, push, deploy, or TWA final verification; these wait on enrichment completion and final Play/Bubblewrap SHA-256.
- Added a TWA asset links workflow: `scripts/twa-assetlinks.mjs` can generate `public/.well-known/assetlinks.json` from the template only with a valid final SHA-256 fingerprint for `com.radiansnail.marginalia`, and can verify the deployed URL.
- Added `scripts/twa-assetlinks.test.mjs` coverage for valid generation, placeholder rejection, malformed/empty fingerprint rejection, wrong-package rejection, deployed JSON verification, and HTML/404 failure cases.
- Updated `PLAY.md` so Google Play/TWA readiness stays blocked until Bubblewrap or Play signing produces the final fingerprint, the real asset links file is committed, deployed, and verified.
- Verified the TWA workflow with `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`; no real `public/.well-known/assetlinks.json` was left behind.
- Made the GitHub repo public at `https://github.com/radiansnail-1/marginalia-co`.
- Created a separate public-main worktree at `E:\2. Current Projects\bookshelf\marginalia-public-main` to avoid disturbing the dirty active app workspace and the user's embedding run.
- Published public readiness commit `9e1e6b7` with README/env/contributing cleanup and removal of private handoff docs from public `main`.
- Closed PR #8 and deleted its remote feature branch because the bootstrap/catalog work was not appropriate to merge publicly as-is.
- Implemented and published public `main` commit `ec4cecd` with UI/catalog fixes: bigger pile `+`, expandable search rows, API title/author metadata resolution, Librarian cover placeholders, DNF on reading screen, donation card, and top-filling shelf visual.
- Verified public-main changes with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `git diff --cached --check`; Vercel reported success for commit `ec4cecd`.
- Investigated the user's API-added "The Trading Game" mismatch: existing row was added from API without Google ID, ISBN, cover, pages, or year. Future API writes now resolve title/author metadata and patch missing fields; existing rows still need re-sync or a one-off backfill.
- Implemented Librarian Concierge V1 locally: `/librarian` now shows 3 picks by default, can reveal up to 6, and supports `Save`, `Not for me`, and `Open` actions.
- Added private recommendation learning schema in `supabase/migrations/0013_librarian_learning.sql` for `recommendation_events` and `user_taste_profiles`.
- Extended recommendation ranking to combine cached book/vibe embeddings with private shelf signals and recommendation events.
- Added spoiler-safe card behavior: ranking can use vibe/review inputs, but cards expose only one concise "why this might fit" line.
- Added ISBN normalization/tests and camera scan/manual fallback in the search/add flow.
- Added in-app Goodreads CSV import with preview/commit flow, status mapping, ISBN/title dedupe, and tests.
- Productized DNF: `abandoned` now closes open reading sessions, removes the book from currently reading, and shows the book on the shelf/collection marked `DNF / set aside`.
- Changed the home room bookshelf to fill books from the top row downward instead of from the bottom.
- Fixed sourced description enrichment pagination so `npm run enrich:descriptions -- --limit=10000` can continue beyond Supabase's 1k row response cap.
- Improved foreign-language/obscure-book search by querying local catalog first, carrying Google Books language metadata, adding Open Library fallback, and matching shelf status by catalog id, Google id, Open Library id, or ISBN.
- Verified the active worktree earlier with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `node --check scripts/enrich-book-descriptions.mjs`.
- Left the active worktree dirty because the user is manually running the enrichment/pre-embedding pipeline. No active-worktree staging, commit, or push was performed after this handoff.

## Earlier 2026-05-12

- Merged PR #7 with cached hybrid Librarian recommender, provider-agnostic embedding config, pre-embed tooling, half-star/legal/API polish, and migrations through `0011_rating_aggregate_maintenance.sql`.
- Added PR #8 as draft for Goodreads/Kaggle catalog seeding, curated seed data, `books.description` migration `0012_book_descriptions.sql`, and sourced Google Books/Open Library description enrichment.
- Confirmed the user-applied `0012_book_descriptions.sql` allows description dry-runs; enrichment dry-run found 4 sourced descriptions out of 5 sampled rows.
- Confirmed the temp Marginalia API token fetched 35 finished shelf books; token was not written to tracked files.
- Reached product decision: PR #8 should not be merged as-is if the repo is becoming public/open-source because of dataset/licensing/local-ops concerns.
- Addressed pre-merge browser comments: home shortcut, add-book button, shelf spines, horizontal shelf rows, local shelf search, pile source labels, time-of-day window note, and half-star reviews.
- Added public legal/OSS surfaces: expanded privacy policy, terms page, license page, root `LICENSE`, `COMMUNITY.md`, README license note, and proxy allowlist for `/terms` and `/license`.
- Added `scripts/preembed-books.mjs` plus `npm run preembed:books`; dry-run works without an embedding key and exits cleanly on Windows.
- Added migration `0011_rating_aggregate_maintenance.sql` with a partial `(book_id, rating)` index, aggregate repair function, and weekly `pg_cron` repair schedule.

## 2026-05-11

- Synced 48 books from the Obsidian vault into the live API via `sync_books.py`: 12 pile, 2 reading, 34 finished.
- Applied migration 0007 for rating aggregates to prod Supabase.
- Shipped PR #6 UI polish: reviews migration 0008, inline review editor, search dedup, reading carousel, cover fallback endpoint, tap-feel utility, icon tabbar, mobile fullscreen metadata, and Google/OpenLibrary preconnects.
- QA'd live public surfaces and protected redirects, made `/privacy` public, and documented remaining Android TWA asset-links work.
- Pivoted signup away from email confirmation because Supabase default mail and Resend sandboxing were not production-ready without a verified domain.

**Last updated:** 2026-05-13

# Plan

**Goal:** Ship Marginalia & Co. as a public/open-source, mobile-first book discovery app with reliable catalog coverage, precomputed embeddings, and a small high-confidence Librarian shortlist.

**Approach:**
- Keep `/librarian` as a concierge shortlist, not a feed: 3 picks by default, with ranks 4-6 behind explicit user intent.
- Treat the Librarian as a data pipeline plus UI, not just a component: enrichment, embeddings, `0013`, candidate sourcing, diagnostics, and fallback behavior all have to be verified together.
- Search local catalog first, then Google Books, then Open Library, and return useful partial results when providers are slow.
- Keep Goodreads import user-owned and metadata-aware: use CSV rows, resolve by ISBN/title, and cap import size.
- Keep TWA readiness explicit: no production `assetlinks.json` until the final Play/Bubblewrap SHA-256 exists.
- Keep public `main` stable; promote staged slices instead of merging the dirty branch wholesale.
- Treat the home bookshelf as an emotional preview, not the complete archive. It now has a hard visual capacity of 109 spines on narrow mobile; large libraries should graduate into richer `/shelf` collection UI rather than forcing every book into the room.

**Milestones:**
- [x] Public GitHub/Vercel baseline is live.
- [x] TWA asset links generator/verifier and Play docs are implemented locally.
- [x] Dirty-branch plan reviewed: staged slices, exactly one subagent used for UI/search/import/DNF lane.
- [x] Added Librarian diagnostics for shelf count, embedded shelf count, signals, profile cache hit, candidate counts, cache hydration, runtime embedding, ranked count, and fallback reason.
- [x] Made Google Books search accept timeout/parent abort options and added timeout tests.
- [x] Added `npm run verify:brain` readiness script for post-enrichment/preembed checks.
- [x] Improved search partial-result behavior and UI metadata for provider timing/availability.
- [x] Improved Goodreads commit flow with import cap, skipped-over-limit reporting, and Google metadata resolution for new rows.
- [x] Fixed reading-session `endSession` ownership check before updating sessions.
- [x] Confirmed `supabase/migrations/0013_librarian_learning.sql` has already been applied per user update.
- [x] Fixed reachable DNF from pile and revalidation after DNF from pile/reading.
- [x] Improved Goodreads import preview copy so large CSV exports show the 2,000-row import cap clearly.
- [x] Browser-verified unauthenticated sign-in shell on desktop and mobile; no console errors.
- [x] Created AgentMail QA account and browser-verified protected route shells for home/search/profile/librarian/reading/shelf on mobile.
- [x] Fixed `/pile` auth loading so authenticated pile/reading rows render through the shared `getCurrentUser()` path.
- [ ] Let the user's current `npm run enrich` finish. Do not kill or restart it.
- [x] Fixed Xiaomi-width home bookshelf overflow by capping spine counts per row and clipping shelf rows.
- [x] Implemented the home shelf overflow indicator after 109 visible spines and limited the home query to visible books plus a count-only total.
- [ ] Design scalable `/shelf` browsing for 250+ books and library analytics/clustering for 500+ books.
- [ ] Run `npm run verify:brain -- --limit=10000` after enrichment finishes.
- [ ] Run `npm run preembed:books -- --dry-run --limit=10000`, then real preembed if dry-run is sane.
- [ ] Manual or Playwright QA for search typing, Goodreads CSV upload, DNF button clicks, and Librarian mood actions; the in-app browser runtime timed out on click/type/screenshot operations.
- [ ] Generate/deploy real `public/.well-known/assetlinks.json` only after final signing SHA-256 exists.

## Resume State

**Status:** Active branch `codex/initial-little-alexandria-app` is intentionally dirty and richer than public `main`. Latest local work fixed Xiaomi home-shelf overflow, implemented the first shelf-scale slice, and produced CEO/eng decisions for high-volume libraries. The user's enrichment job may still be running and must not be disturbed.

**Last action:** QA-seeded the AgentMail test account up to 500 finished books, limited `/home` to 109 visible spine rows plus a count-only total, added `109 here +391 stacked` overflow copy, and extracted `src/components/room/bookshelf-layout.ts` with tests for 36/109/110/500-book cases.

**Next action:** For the remaining shelf-scale work, design `/shelf` to shift from a flat list into a search-first library index around 250+ books. Separately, wait for the current enrichment run to finish, capture its `checked/found/updated/missed` output, then run `npm run verify:brain -- --limit=10000` and the preembed dry-run.

**Repo state:** Active app root is `E:\2. Current Projects\bookshelf\marginalia`. Branch is `codex/initial-little-alexandria-app` tracking `origin/codex/initial-little-alexandria-app`, dirty. Latest commits:
- `1204078` Add sourced book description enrichment
- `d8b0966` Add Goodreads catalog seeding
- `15fc909` Add cached hybrid Librarian recommender
- `9d886c3` Handoff: update plan + changelog after PR #6 merge
- `2461e74` UI polish: tap-feel, icons, reviews, swipe, cover fallback

**Dirty worktree summary:**
- Modified tracked files include `PLAY.md`, `package.json`, `plan.md`, `learnings.md`, `changelog.md`, `scripts/enrich-book-descriptions.mjs`, Librarian/search/profile/reading/pile/shelf UI and action files, `src/app/api/v1/books/route.ts`, `src/lib/books/google-books.ts`, `src/lib/books/open-library.ts`, and `src/lib/librarian/recommend.ts`.
- Untracked implementation files include `scripts/twa-assetlinks.mjs`, `scripts/twa-assetlinks.test.mjs`, `scripts/verify-brain-readiness.mjs`, Goodreads import files/tests, ISBN files/tests, `src/lib/books/google-books.test.ts`, shelf layout tests/helpers, and `supabase/migrations/0013_librarian_learning.sql`.
- Public-main comparison worktree still exists at `E:\2. Current Projects\bookshelf\marginalia-public-main`.

**Verification:**
- `npm test` passed, 19 tests.
- `npm run lint` previously passed; the later full lint run timed out after 120s with no surfaced error, while `npx eslint src/components/room/bookshelf.tsx` passed in 109s.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- `node --check scripts/verify-brain-readiness.mjs` passed.
- `git diff --check` passed with line-ending warnings only.
- Browser QA at 360x800 verified the seeded 36-book home shelf no longer overflows; Browser console reported 0 errors. Browser screenshot output tiled the viewport, so use the leftmost tile as the real phone frame.
- Browser QA at 360x800 with 500 QA books verified the room renders 109 visible spines and shows `109 here +391 stacked` without right-edge clipping. A later dev-server restart was needed after `next build` rewrote `.next` under a live `next dev`; production build itself passed.
- `npm run verify:brain` was not run because it touches live Supabase and should wait until enrichment finishes.
- Real preembed, deploy, and live TWA verification were not run.
- Authenticated browser QA was blocked because the local browser had no signed-in session and creating a confirmed Supabase user would mutate the configured project.

## PR Slicing

Promote the dirty branch in small slices:

1. **PR 1: TWA tooling/docs only** - `PLAY.md`, TWA assetlinks generator/verifier/tests, manifest/icon docs. No app behavior or data-pipeline changes.
2. **PR 2: Search/import/DNF safety fixes** - search partial results and ISBN fallback, Goodreads preview/import flow, DNF from pile/reading, shelf-status tests, Google/Open Library provider safety.
3. **PR 3: Librarian diagnostics + brain readiness tooling** - recommendation diagnostics, `verify:brain`, enrichment/preembed readiness docs, and post-enrichment checks.
4. **PR 4: Concierge/recommendation learning after `0013`** - persisted recommendation events, taste profile cache, concierge actions, and learning behavior now that `0013` is applied.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-12 | Current | Build a tiny personalized shortlist, not a feed. | No |
| CEO shelf-scale | 2026-05-12 | Current | Home shelf is a preview; high-volume users need progressive collection UI after visual capacity. | No |
| Eng | 2026-05-12 | Current | Staged dirty-branch plan accepted; one subagent used for parallel UI/search/import/DNF lane. | No |
| Design | 2026-05-12 | Stale | Needs browser/mobile QA after latest search, import, DNF, and Librarian changes. | Yes |
| DX | 2026-05-12 | Partial | Repo public and docs sanitized; no deep contributor DX pass after dirty-branch slices. | Somewhat |

**Review verdict:** ENG PLAN IMPLEMENTED LOCALLY; DATA PIPELINE AND MOBILE QA STILL BLOCK RELEASE.

**Next review:** Run browser QA/design audit after enrichment, preembed, and `0013` are done. Run DX/security before soliciting contributors heavily.

**Blockers / open questions:**
- Current enrichment job may still be running. Do not interrupt it.
- Home shelf currently shows at most 109 spines; for 100 books it can show the whole collection, and for 500 books it now shows an explicit `109 here +391 stacked` overflow hint linking to `/shelf`.
- `/shelf` fetches and renders a flat client-side list. This is acceptable for about 100 books, probably tolerable at 500, but not yet a "library-scale" UI with virtualization, grouping, or year/rating/genre browsing.
- Final Bubblewrap/Play signing SHA-256 is missing, so no real `public/.well-known/assetlinks.json` yet.
- `0013_librarian_learning.sql` is applied per user update; still verify the target Supabase project before release.
- Need post-enrichment brain readiness numbers: embedded current/stale count, missing descriptions, missing covers, learning table availability.
- Need authenticated mobile/browser QA for search partial results, Goodreads import, DNF transitions, Librarian actions, and scanner fallback.
- Need final signing SHA-256 from Play Console App Signing or Bubblewrap/local keystore before generating production assetlinks.

**Context pointers:**
- Brain readiness: `scripts/verify-brain-readiness.mjs`, `scripts/preembed-books.mjs`, `scripts/enrich-book-descriptions.mjs`
- Librarian: `src/lib/librarian/recommend.ts`, `src/lib/librarian/embeddings.ts`, `src/app/(app)/librarian/actions.ts`, `src/app/(app)/librarian/librarian-client.tsx`
- Search: `src/app/(app)/search/actions.ts`, `src/app/(app)/search/page.tsx`, `src/lib/books/google-books.ts`, `src/lib/books/open-library.ts`
- Import/ISBN: `src/app/(app)/profile/import-actions.ts`, `src/app/(app)/profile/goodreads-import-panel.tsx`, `src/lib/books/goodreads-import.ts`, `src/lib/books/isbn.ts`
- DNF/reading: `src/app/(app)/reading/actions.ts`, `src/app/(app)/reading/reading-session.tsx`, `src/app/(app)/pile/actions.ts`, `src/app/(app)/shelf/shelf-client.tsx`
- Shelf scale: `src/components/room/bookshelf.tsx`, `src/app/(app)/home/page.tsx`, `src/app/(app)/shelf/page.tsx`, `src/app/(app)/shelf/shelf-client.tsx`
- TWA: `scripts/twa-assetlinks.mjs`, `scripts/twa-assetlinks.test.mjs`, `public/.well-known/assetlinks.template.json`, `PLAY.md`

**How to resume:**
```bash
cd "E:\2. Current Projects\bookshelf\marginalia"
git status --short --branch
```

Then check whether the user's enrichment job has finished before running:
```bash
npm run verify:brain -- --limit=10000
npm run preembed:books -- --dry-run --limit=10000
```

**Out of scope:** Killing/restarting enrichment, merging scraped/Kaggle data publicly, native app rewrite, pgvector/HNSW rewrite, fake production asset links, broad cleanup/reset, committing/pushing/deploying from handoff.

**Last updated:** 2026-05-12

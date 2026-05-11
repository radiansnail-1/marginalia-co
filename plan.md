# Plan

**Goal:** Make Marginalia & Co.'s search, pile, and mobile app shell feel correct enough for a production PWA/TWA pass.

**Approach:**
- Fix search and pile at the data/state layer, not just with UI labels.
- Keep the reading-room UI intact while reducing route latency and bad loading states.
- Use PWA manifest settings for fullscreen behavior, with TWA/native immersive mode noted for Android.

**Milestones:**
- [x] QA live app at `marginalia-co.vercel.app` across auth, search, pile, shelf, profile, and mobile layouts.
- [x] Identify production blocker: Supabase `ON CONFLICT` failed because the Google Books unique index was partial.
- [x] Add a migration to make `books.google_books_id` a valid upsert conflict target.
- [x] Fix search results so already-saved books show their shelf status on repeat searches.
- [x] Improve per-book save state and remove raw database errors from the search UI.
- [x] Reduce pile page latency by collapsing two shelf queries into one and using `getClaims()` instead of full `getUser()` on the pile render path.
- [x] Add a pile loading shell and prefetch tab routes.
- [x] Update PWA fullscreen display metadata.
- [ ] Apply the Supabase migration in production.
- [ ] Re-test live save-to-pile after the production migration is applied.

## Resume State

**Status:** Local code is implemented and checked; production still needs the Supabase migration before `+ Pile` can save successfully.

**Last action:** Verified the local mobile Home to Pile route after the pile optimization; local navigation measured about 0.8s, down from about 3.7s in dev browser timing.

**Next action:** Run the GitHub publish flow, then apply `supabase/migrations/0006_books_google_id_full_unique.sql` to production Supabase and re-test live search-to-pile.

**Repo state:** Branch `codex/initial-little-alexandria-app`; dirty worktree contains search, pile, PWA, and handoff changes. Latest commit is `b2aabab prep Marginalia for Play and affiliates`.

**Verification:** `npm run lint` passed. `npx tsc --noEmit` passed. `node --test "src/app/(app)/search/shelf-status.test.ts"` passed with 2 tests. Browser QA checked local mobile search and pile after changes.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-11 | Historical | Existing `ceo-review.md` exists in workspace root, not rerun this session | unknown |
| Eng | 2026-05-11 | Historical | Existing `eng-review.md` exists in workspace root, not rerun this session | unknown |
| Design | - | - | No design review log found | unknown |
| DX | - | - | No DX review log found | unknown |

**Review verdict:** NO CURRENT REVIEW LOGS.

**Next review:** Run a focused QA pass after the production DB migration lands.

**Blockers / open questions:** Supabase production migration requires credentials/access. PWA fullscreen cannot hide Android/iOS system bars in a normal browser tab; installed PWA/TWA may honor fullscreen, and Android TWA may still need native immersive mode.

**Context pointers:**
- Key files: `src/app/(app)/search/actions.ts`, `src/app/(app)/search/page.tsx`, `src/app/(app)/search/shelf-status.ts`, `src/app/(app)/pile/page.tsx`, `src/app/(app)/pile/loading.tsx`, `src/components/tab-bar.tsx`, `public/manifest.webmanifest`, `src/app/layout.tsx`, `supabase/migrations/0006_books_google_id_full_unique.sql`.
- Repo context: `b2aabab - prep Marginalia for Play and affiliates`; branch `codex/initial-little-alexandria-app`.
- External: live app at `https://marginalia-co.vercel.app`.

**How to resume:** `cd "E:\2. Current Projects\bookshelf\marginalia" && git status --short --branch`

**Out of scope:** Did not generate API tokens. Did not apply Supabase production migrations due missing Supabase access token. Did not build or upload the TWA.

**Last updated:** 2026-05-11

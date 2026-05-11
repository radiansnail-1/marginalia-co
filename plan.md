# Plan

**Goal:** Ship the focused Marginalia & Co. new-user QA fixes: reliable add-to-pile, clearer first-run UX, stable navigation labels, safer advanced API access, account-only identity, and book rating aggregates.

**Approach:**
- Fix the save path at the data layer so it no longer depends on a production-only Supabase index migration.
- Keep the reading-room visual language, but replace fragile symbols with stable text and obvious first-run actions.
- Move developer-oriented API token creation behind an advanced disclosure, while adding a human-readable `/api` docs page.
- Require a real email/password account instead of anonymous guest mode so shelves, ratings, and API tokens are tied to a durable user.
- Store shared book rating aggregates in the database from per-user ratings so future ML/ranking work has a clean signal.

**Milestones:**
- [x] QA live app at `marginalia-co.vercel.app` as a new user across home, search, pile, librarian, profile, API docs, and mobile layouts.
- [x] Run focused engineering review before fixing: prioritize data-layer save reliability, user-facing confusion, and silent/technical failures.
- [x] Replace Supabase `upsert(... onConflict: "google_books_id")` in `addToPile` with insert plus duplicate fallback.
- [x] Replace broken glyph/question-mark nav surfaces with stable text labels and ASCII-safe copy.
- [x] Add an empty-shelf "Add your first book" CTA and an accessible search clear button.
- [x] Hide API tokens behind "Advanced: API access" and add `/api` as human-readable API docs.
- [x] Remove user-facing `ANTHROPIC_API_KEY`/LLM implementation copy from Librarian fallback.
- [x] Force account creation by removing guest sign-in, redirecting anonymous sessions, and blocking anonymous API token creation.
- [x] Add `supabase/migrations/0007_book_rating_aggregates.sql` and expose `average_rating` / `rating_count` on book detail and API responses.
- [x] Verify locally with typecheck, focused lint, regression test, production build, and browser QA.
- [x] Publish the branch to GitHub and open draft PR #3.
- [ ] Apply Supabase migrations and deploy the PR branch or merge target, then re-test live account signup, `+ Pile`, ratings, and API docs on Vercel.

## Resume State

**Status:** The fix set is implemented, verified, pushed, and open as draft PR #3. The branch now includes account-only auth and database-maintained rating aggregates.

**Last action:** Committed and pushed `4a049cb require accounts and aggregate ratings` to draft PR #3 at `https://github.com/radiansnail-1/marginalia-co/pull/3`.

**Next action:** Apply Supabase migrations `0006` and `0007` in the target database, then verify the deployed Vercel preview/live app after GitHub/Vercel builds PR #3.

**Repo state:** Branch `codex/initial-little-alexandria-app`, pushed to origin. Draft PR #3 targets `main`.

**Verification:** Passed `npx tsc --noEmit`, focused ESLint on changed app/auth/API files, `node --test "src/app/(app)/search/shelf-status.test.ts"`, `npm run build`, and Browser QA on `http://127.0.0.1:3007` for the first QA patch set. Full `npm run lint` passed before the account/rating follow-up but later timed out in this environment with no explicit lint errors; focused lint passed for the follow-up.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-11 | Historical | Existing `ceo-review.md` exists in workspace root, not rerun this session | unknown |
| Eng | 2026-05-11 | Focused session review | Prioritized add-to-pile data path, broken glyph surfaces, first-run clarity, and technical copy leaks | no for this patch scope |
| Design | - | - | No design review log found | unknown |
| DX | - | - | No DX review log found | unknown |

**Review verdict:** CLEARED for focused QA fix PR. No current gstack review log was available from `gstack-review-read`.

**Next review:** Run QA against the deployed Vercel preview/live app after the PR is published.

**Blockers / open questions:** Live Vercel still needs deployment of this branch before fixes appear. Supabase migration `0007_book_rating_aggregates.sql` must be applied before code selecting `average_rating` / `rating_count` hits that database. Supabase migration `0006_books_google_id_full_unique.sql` is still useful cleanup, but `addToPile` no longer depends on it for the main save path.

**Context pointers:**
- Key files: `src/app/(app)/search/actions.ts`, `src/app/(app)/search/page.tsx`, `src/components/tab-bar.tsx`, `src/components/room/bookshelf.tsx`, `src/app/(app)/profile/token-panel.tsx`, `src/app/(app)/profile/token-actions.ts`, `src/app/auth/sign-in/page.tsx`, `src/proxy.ts`, `src/lib/supabase/user.ts`, `src/app/(app)/books/[id]/page.tsx`, `src/app/api/page.tsx`, `src/app/api/v1/books/route.ts`, `src/app/api/v1/route.ts`, `supabase/migrations/0007_book_rating_aggregates.sql`.
- Repo context: latest code commit is `4a049cb - require accounts and aggregate ratings`; branch `codex/initial-little-alexandria-app`.
- External: PR `https://github.com/radiansnail-1/marginalia-co/pull/3`; live app `https://marginalia-co.vercel.app`; local verified URL was `http://127.0.0.1:3007`.

**How to resume:** `cd "E:\2. Current Projects\bookshelf\marginalia" && git status --short --branch`

**Out of scope:** Did not implement OAuth/importers, search ranking/edition deduplication, the ML model itself, production deployment, Supabase production migration execution, or TWA upload.

**Last updated:** 2026-05-11

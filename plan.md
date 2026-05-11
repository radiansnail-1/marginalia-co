# Plan

**Goal:** Ship the focused Marginalia & Co. new-user QA fixes: reliable add-to-pile, clearer first-run UX, stable navigation labels, and safer advanced API access.

**Approach:**
- Fix the save path at the data layer so it no longer depends on a production-only Supabase index migration.
- Keep the reading-room visual language, but replace fragile symbols with stable text and obvious first-run actions.
- Move developer-oriented API token creation behind an advanced disclosure, while adding a human-readable `/api` docs page.

**Milestones:**
- [x] QA live app at `marginalia-co.vercel.app` as a new user across home, search, pile, librarian, profile, API docs, and mobile layouts.
- [x] Run focused engineering review before fixing: prioritize data-layer save reliability, user-facing confusion, and silent/technical failures.
- [x] Replace Supabase `upsert(... onConflict: "google_books_id")` in `addToPile` with insert plus duplicate fallback.
- [x] Replace broken glyph/question-mark nav surfaces with stable text labels and ASCII-safe copy.
- [x] Add an empty-shelf "Add your first book" CTA and an accessible search clear button.
- [x] Hide API tokens behind "Advanced: API access" and add `/api` as human-readable API docs.
- [x] Remove user-facing `ANTHROPIC_API_KEY`/LLM implementation copy from Librarian fallback.
- [x] Verify locally with lint, typecheck, tests, production build, and browser QA.
- [x] Publish the branch to GitHub and open draft PR #3.
- [ ] Deploy the PR branch or merge target, then re-test live `+ Pile` on Vercel.

## Resume State

**Status:** The fix set is implemented, verified, pushed, and open as draft PR #3.

**Last action:** Pushed `codex/initial-little-alexandria-app` and opened draft PR #3 at `https://github.com/radiansnail-1/marginalia-co/pull/3`.

**Next action:** Verify the deployed Vercel preview/live app after GitHub/Vercel builds PR #3.

**Repo state:** Branch `codex/initial-little-alexandria-app`, pushed to origin. Draft PR #3 targets `main`.

**Verification:** Passed `npm run lint`, `npx tsc --noEmit`, `node --test "src/app/(app)/search/shelf-status.test.ts"`, `npm run build`, and Browser QA on `http://127.0.0.1:3007` for home, search, add-to-pile, pile, librarian, profile, and `/api`.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-11 | Historical | Existing `ceo-review.md` exists in workspace root, not rerun this session | unknown |
| Eng | 2026-05-11 | Focused session review | Prioritized add-to-pile data path, broken glyph surfaces, first-run clarity, and technical copy leaks | no for this patch scope |
| Design | - | - | No design review log found | unknown |
| DX | - | - | No DX review log found | unknown |

**Review verdict:** CLEARED for focused QA fix PR. No current gstack review log was available from `gstack-review-read`.

**Next review:** Run QA against the deployed Vercel preview/live app after the PR is published.

**Blockers / open questions:** Live Vercel still needs deployment of this branch before fixes appear. Supabase migration `0006_books_google_id_full_unique.sql` is still useful cleanup, but `addToPile` no longer depends on it for the main save path.

**Context pointers:**
- Key files: `src/app/(app)/search/actions.ts`, `src/app/(app)/search/page.tsx`, `src/components/tab-bar.tsx`, `src/components/room/bookshelf.tsx`, `src/app/(app)/profile/token-panel.tsx`, `src/lib/librarian/recommend.ts`, `src/app/api/page.tsx`.
- Repo context: latest existing commit before this publish flow is `8ea6290 - fix search pile and app shell`; branch `codex/initial-little-alexandria-app`.
- External: PR `https://github.com/radiansnail-1/marginalia-co/pull/3`; live app `https://marginalia-co.vercel.app`; local verified URL was `http://127.0.0.1:3007`.

**How to resume:** `cd "E:\2. Current Projects\bookshelf\marginalia" && git status --short --branch`

**Out of scope:** Did not implement email onboarding, search ranking/edition deduplication, production deployment, Supabase production migration, or TWA upload.

**Last updated:** 2026-05-11

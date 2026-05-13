# Plan

**Goal:** Ship Marginalia & Co. as a public/open-source, mobile-first book discovery app with reliable search/import flows, precomputed Librarian brain data, and an explicit TWA readiness gate.

**Approach:**
- Keep `/librarian` as a small personalized shortlist, not a feed: 3 picks by default, ranks 4-6 behind explicit user action.
- Treat the Librarian as a data pipeline plus UI: enrichment, Codex-authored semantic summaries, embedding freshness, `0013`, candidate sourcing, diagnostics, and fallback behavior all have to stay verified together.
- Use staged release slices instead of merging the dirty branch wholesale into public `main`.
- Search local catalog first, then Google Books, then Open Library, and return useful partial results when providers are slow.
- Keep Goodreads import metadata-aware and user-owned: resolve metadata during import, cap oversized CSVs, report skipped/error counts clearly.
- Keep TWA readiness explicit: no production `assetlinks.json` until the final Play/Bubblewrap SHA-256 exists.
- Treat the home bookshelf as an emotional preview, not the complete archive; large libraries belong in scalable `/shelf` browsing.

**Milestones:**
- [x] Public GitHub/Vercel baseline is live.
- [x] TWA asset links generator/verifier and Play docs are implemented locally.
- [x] Dirty-branch release plan reviewed: staged slices, with one UI/search/import/DNF side lane.
- [x] Added Librarian diagnostics for shelf count, embedded shelf count, signals, profile cache hit, candidate counts, cache hydration, runtime embedding, ranked count, and fallback reason.
- [x] Added `npm run verify:brain` readiness checks for embeddings, metadata, summaries, and learning tables.
- [x] Added `0013_librarian_learning.sql`; user reported it applied.
- [x] Added `0014_book_embedding_summaries.sql`; user applied it before summary work.
- [x] Completed Codex-authored embedding summaries for the 10k scanned catalog set.
- [x] Ran real preembedding for the 10k scanned catalog set after summaries were complete.
- [x] Final brain verification: 10,000 current embeddings, 0 stale embeddings, 0 missing embedding summaries.
- [x] Improved search partial-result behavior and provider timing/availability UI.
- [x] Improved Goodreads import preview/commit flow with caps and metadata resolution.
- [x] Fixed reading-session `endSession` ownership check before updating sessions.
- [x] Fixed reachable DNF from pile/reading and revalidation after DNF.
- [x] Browser-smoked desktop protected routes for Librarian, search, ISBN fallback, profile import UI, reading, pile, shelf, and home.
- [ ] Run safe mutation QA in a throwaway/test account or with explicit approval: Librarian save/not-for-me/open, DNF from reading/pile, Goodreads import preview/commit/duplicate commit.
- [ ] Run true mobile viewport/device QA for search, shelf, profile import, reading, pile, and Librarian.
- [ ] Slice the dirty branch into focused PRs for review and public `main`.
- [ ] Generate/deploy real `public/.well-known/assetlinks.json` only after final signing SHA-256 exists.

## Resume State

**Status:** The 10k Librarian brain scan is now green locally: summaries are filled, embeddings are current, and core CLI checks plus desktop browser smoke passed. The branch remains intentionally dirty and should still be promoted in slices rather than shipped as one broad merge.

**Last action:** Completed the overnight Codex-authored summary worker loop, ran real embedding precompute with retry/backoff fixes, verified `npm run verify:brain -- --limit=10000`, ran `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and browser-smoked key desktop routes on `http://localhost:3000`.

**Next action:** Do targeted release QA, especially mutation flows and mobile viewport/device coverage. After that, decide PR slices and start with the narrow data/Librarian plus safety fixes, keeping TWA final SHA blocked until the real fingerprint exists.

**Repo state:** Active app root is `E:\2. Current Projects\bookshelf\marginalia`. Branch is `codex/initial-little-alexandria-app` tracking `origin/codex/initial-little-alexandria-app`, ahead 1 and dirty. Latest commits:
- `b45293f` Fix mobile shelf scaling
- `1204078` Add sourced book description enrichment
- `d8b0966` Add Goodreads catalog seeding
- `15fc909` Add cached hybrid Librarian recommender
- `9d886c3` Handoff: update plan + changelog after PR #6 merge

**Dirty worktree summary:**
- Modified tracked files include `PLAY.md`, `README.md`, `package.json`, `scripts/enrich-book-descriptions.mjs`, `scripts/preembed-books.mjs`, Librarian/search/profile/reading/pile/shelf UI and action files, `src/app/api/v1/books/route.ts`, provider clients, and Librarian embedding/recommendation logic.
- Untracked implementation files include summary export/apply/generator scripts, TWA assetlinks scripts/tests, `verify-brain-readiness`, Goodreads import files/tests, ISBN files/tests, Google Books tests, `0013_librarian_learning.sql`, `0014_book_embedding_summaries.sql`, and `tmp/`.
- `tmp/embedding-summary-updates/` contains Codex-authored JSONL summary audit artifacts. Leave it alone unless the user explicitly asks to clean it up.

**Verification:**
- `npm run verify:brain -- --limit=10000` passed with: scanned 10,000; embeddings current 10,000; stale 0; present 10,000; missing embedding summaries 0; missing descriptions 4,300; missing covers 9,846; user shelf rows 565; `recommendation_events` ok; `user_taste_profiles` ok.
- `npm run preembed:books -- --dry-run --limit=10000` found the expected 10,000 needing embeddings before the real run.
- `npm run preembed:books -- --limit=10000 --batch=64` completed after adding retry/backoff and fixing cache/freshness scan bugs.
- `npm test` passed, 19 tests. Non-fatal Node typeless-package warnings appeared for ESM tests.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Browser smoke on local desktop passed for `/home`, `/librarian`, `/search`, ISBN camera-unavailable fallback, `/profile`, `/reading`, `/pile`, and `/shelf` with no console errors observed.
- Not done: mobile viewport QA, Goodreads commit mutation, DNF click mutation, Librarian save/not-for-me/open mutation.
- Not done: commit, push, deploy, public PR, or live TWA final verification.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-12 | Current | Build a tiny personalized shortlist, not a feed. | No |
| CEO shelf-scale | 2026-05-12 | Current | Home shelf is a preview; high-volume users need progressive collection UI. | No |
| Eng | 2026-05-12 | Current | Staged dirty-branch plan accepted; data pipeline first, UI/import/search/DNF next. | No |
| Design | 2026-05-12 | Stale | Needs mobile/device QA after latest data, search, import, DNF, and Librarian changes. | Yes |
| DX | 2026-05-12 | Partial | Repo public and docs sanitized; no deep contributor DX pass after dirty-branch slices. | Somewhat |

**Review verdict:** DATA/BRAIN PIPELINE GREEN LOCALLY; RELEASE WAITS ON TARGETED QA AND STAGED PR REVIEW.

**Next review:** Run QA/design audit on mobile and mutation flows before shipping. Run engineering review again only if PR slicing changes the architecture or data model.

**Blockers / open questions:**
- Need explicit permission or a safe throwaway account for mutation QA: DNF, Librarian save/not-for-me/open, Goodreads import commit and duplicate commit.
- Need true mobile viewport/device QA; the current in-app browser surface did not expose viewport resizing during the smoke pass.
- Final Bubblewrap/Play signing SHA-256 is missing, so production `assetlinks.json` remains blocked.
- Public `main` should stay stable; do not merge the active dirty branch wholesale.
- Missing covers remain high in the 10k catalog scan; this does not block embeddings but affects visual polish and search/library perception.

**Context pointers:**
- Brain readiness: `scripts/verify-brain-readiness.mjs`, `scripts/preembed-books.mjs`, `scripts/enrich-book-descriptions.mjs`
- Summary workflow: `scripts/export-embedding-summary-work.mjs`, `scripts/apply-embedding-summaries.mjs`, `supabase/migrations/0014_book_embedding_summaries.sql`, `tmp/embedding-summary-updates/`
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
npm run verify:brain -- --limit=10000
```

Then run targeted QA before any ship decision.

**Out of scope:** Killing/restarting enrichment, merging scraped/Kaggle data publicly, native app rewrite, pgvector/HNSW rewrite, fake production asset links, broad cleanup/reset, committing/pushing/deploying from handoff.

**Last updated:** 2026-05-13

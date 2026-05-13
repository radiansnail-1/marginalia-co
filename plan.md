# Plan

**Goal:** Publish the QA-verified librarian latency, loading-state, and metadata-hardening work for Marginalia & Co.

**Approach:**
- Keep the librarian comprehensive by using Google Books alongside catalog candidates, while bounding optional request-time work.
- Use authenticated Browser QA with the supplied test account to verify real user flows across desktop, laptop, and mobile.
- Preserve unrelated local changes and publish only the verified source/test changes plus current handoff state.

**Milestones:**
- [x] QA production and local app readiness gaps.
- [x] Remove the Project Hail Mary QA artifact from the production test account.
- [x] Add stale catalog metadata backfill when saving richer search results.
- [x] Add librarian loading state that makes recommendation wait time intentional.
- [x] Keep Google Books in librarian recommendations and tighten the server latency path.
- [x] Verify authenticated librarian timing under the 5 second target after fixes.
- [ ] Push branch and open a draft PR for review.

## Resume State

**Status:** The librarian fixes are committed locally as `903b695 Tighten librarian recommendations`; the branch is ahead of origin by one commit before publish.

**Last action:** Authenticated QA with `awesomebt28@gmail.com` verified librarian loading and recommendation flows. Before the latency patch, librarian calls measured about 6.1s and 7.8s. After the patch, verified timings were about 4.8s on desktop, 3.5s on desktop repeat, and 3.5s on mobile.

**Next action:** Use the GitHub publish workflow to push `codex/initial-little-alexandria-app` and open a draft PR against the repository default branch.

**Repo state:** Branch `codex/initial-little-alexandria-app` is ahead of `origin/codex/initial-little-alexandria-app` by `903b695`. `PLAY.md` remains modified and intentionally out of scope. The handoff files are updated for resume context.

**Verification:** Passed `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Browser QA verified authenticated login, librarian loading, recommendation results, recommendation detail open/back, and desktop/laptop/mobile responsive behavior. Browser screenshot capture timed out, so evidence came from DOM snapshots, visible DOM, timings, and console logs.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | - | - | No review log found. | unknown |
| Eng | 2026-05-13 | informal | User requested investigate plus eng review; plan changed to keep Google Books and cap latency. | no |
| Design | - | - | No review log found. | unknown |
| DX | - | - | No review log found. | unknown |

**Review verdict:** CLEARED

**Next review:** None required before opening the draft PR. A follow-up product QA pass can focus on donation URL, Goodreads import with a real CSV, and affiliate dashboard attribution.

**Blockers / open questions:** Browser Use screenshot capture timed out during QA, but DOM and timing evidence were sufficient. Donation link, real Goodreads export import, and affiliate dashboard attribution remain launch-confidence items outside this fix.

**Context pointers:**
- Key files: `src/lib/librarian/recommend.ts`, `src/app/(app)/librarian/actions.ts`, `src/app/(app)/librarian/librarian-client.tsx`, `src/app/(app)/search/actions.ts`, `src/app/(app)/search/book-metadata.ts`, `src/app/(app)/search/book-metadata.test.ts`
- Repo context: `903b695 Tighten librarian recommendations`, `a2d8375 Fix scanner preview startup race`, `f4c45b3 Fix ISBN scanning and preserve search metadata`
- External: local QA target `http://localhost:3001`; production target previously tested at `https://marginalia-co.vercel.app`

**How to resume:** `cd "E:\2. Current Projects\bookshelf\marginalia"; git status --short --branch; gh pr status`

**Out of scope:** Do not stage `PLAY.md` unless the user explicitly asks. Do not run donation, Goodreads CSV, or affiliate dashboard work as part of this PR.

**Last updated:** 2026-05-13

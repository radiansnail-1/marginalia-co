# Plan

**Goal:** Ship Marginalia & Co. live with a tactile mobile feel, a real reviews path, durable account-only auth, and reliable cover art for every book in the catalog.

**Approach:**
- Keep the web app as the source of truth for the Android TWA/PWA shell.
- Keep protected reader features behind durable email/password accounts; signup bypasses email confirmation because there is no verified sending domain.
- Treat the room (shelf + coffee table) as two large tap zones to /shelf and /reading; individual spines are decorative.
- For multiple in-progress books, render a horizontal snap-x carousel rather than a chip selector.
- For API-imported books, fall back to Google Books for cover art and metadata when the caller doesn't provide them.

**Milestones:**
- [x] QA live app public surfaces and protected redirects.
- [x] Fix public `/privacy` route so Play Console can reach the privacy policy.
- [x] Pivot signup to no-email-confirmation (Supabase service role admin createUser) and deploy.
- [x] Sync 48 books from Obsidian vault via Marginalia API into pile/reading/finished.
- [x] Apply migration 0007 (rating aggregates) to prod Supabase.
- [x] UI polish pass: reviews, swipe, search dedup, cover fallback, tap feel, icons, fullscreen meta. Merged in PR #6.
- [ ] Apply migration 0008 (`user_books.review`) to prod Supabase.
- [ ] After 0008 is live, call `POST /api/v1/books/backfill-covers` to fill cover art for the 48 synced books.
- [ ] TWA `/.well-known/assetlinks.json` with the production signing fingerprint.
- [ ] Signup rate-limit hardening before Play listing.

## Resume State

**Status:** PR #6 ("UI polish: tap-feel, icons, reviews, swipe, cover fallback") merged to `main` at 2026-05-11 22:29Z. Vercel is redeploying main. Migration 0008 is committed in-repo but has NOT yet been applied to the prod Supabase database — the live `/books/[id]` page will 500 on the user-books query (selecting `review`) until that SQL is pasted into the Supabase SQL editor.

**Last action:** Wrote and merged PR #6 to main containing migration 0008, the review editor, reading carousel, search dedup, cover fallback endpoint, tap-feel utility, icon tabbar, and home-page tap zone consolidation. Lint and typecheck pass. Pushed `codex/initial-little-alexandria-app` → merged via `gh pr merge 6 --merge --admin` (merge commit `b94e52f`).

**Next action:** User pastes the SQL from `supabase/migrations/0008_user_book_reviews.sql` into the Supabase SQL editor. After confirmation, run:
```
curl -X POST https://marginalia-co.vercel.app/api/v1/books/backfill-covers \
  -H "Authorization: Bearer mg_WXaTY10S14gG0mBqIfuURibNIzEFl4v8"
```
and verify `GET /api/v1/books` still returns 200 with `review` field populated where present.

**Repo state:** Branch `codex/initial-little-alexandria-app` and `main` both at `b94e52f` (well, `main` has the merge commit; feature branch is at `2461e74` which was fast-forwarded into main). Working tree clean.

**Verification:** `npm run lint` passes. `npx tsc --noEmit` passes. No build run after the merge — Vercel handles it. Browser-driven QA of the new carousel/swipe/review flow is unverifiable from this environment (Browser Use not installed).

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-11 | Prior session | Scope focused on TWA, real shelf, Librarian, API. | Partly stale after UI pivot |
| Eng | 2026-05-11 | Inline review of 9-point user punch list | All 9 items shipped in PR #6; one-line .tap CSS utility covers tap-feel cleanly; whole-zone taps respect Hierarchy as Service. | Current |
| Design | 2026-05-11 | Prior session | Dark-academia mobile UI remains locked. | Mostly current; verify icon tabbar against existing palette |
| DX | - | Not run | `/api/v1/books` now exposes `review`; backfill endpoint added; needs DX review before advertising. | Unknown |

**Review verdict:** NEEDS QA after migration 0008 is applied. The visual + tap-feel pass is in production-shape; the review path is data-shape-blocked behind one SQL paste.

**Next review:** Live QA pass once 0008 lands, covering: rate a book, write a review on book detail, swipe between two reading books, observe tabbar icons, install PWA, observe URL bar collapse.

**Blockers / open questions:**
- Migration 0008 must be applied to prod Supabase before /books/[id] will render after this deploy (the page selects `review`).
- Cover backfill endpoint is auth'd and capped at 80 books per call — single call covers the 48 synced books.
- True fullscreen / hidden system bars require PWA install or TWA wrapper; browser tab cannot achieve it, even with `display: fullscreen` in the manifest.
- `/.well-known/assetlinks.json` is still 404 live; final Android TWA requires the real asset links file.
- Resend remains sandboxed; no domain → no email confirmation path. Decide later whether to re-enable email confirmation once a domain is available.

**Context pointers:**
- App root: `E:\2. Current Projects\bookshelf\marginalia`
- New files in PR #6:
  - `supabase/migrations/0008_user_book_reviews.sql`
  - `src/app/(app)/books/[id]/review-editor.tsx`
  - `src/app/(app)/reading/reading-carousel.tsx`
  - `src/app/api/v1/books/backfill-covers/route.ts`
- Edited (load-bearing): `src/components/tab-bar.tsx`, `src/components/room/bookshelf.tsx`, `src/components/room/spine.tsx`, `src/components/room/coffee-table.tsx`, `src/app/(app)/home/page.tsx`, `src/app/(app)/reading/page.tsx`, `src/app/(app)/reading/reading-session.tsx`, `src/app/(app)/search/actions.ts`, `src/app/api/v1/books/route.ts`, `src/app/globals.css` (.tap utility), `src/app/layout.tsx` (mobile meta), `src/components/finish-prompt.tsx`.
- Live app: `https://marginalia-co.vercel.app`
- Marginalia API token (user's): `mg_WXaTY10S14gG0mBqIfuURibNIzEFl4v8`
- Obsidian vault source for synced books: `C:\Users\aweso\OneDrive\Documents\Obsidian_Brian\wiki\entities\books`
- Sync script: `E:\2. Current Projects\bookshelf\sync_books.py` (no longer needs to be rerun — 48 books in place; backfill endpoint handles cover gaps now).

**How to resume:**
```
cd "E:\2. Current Projects\bookshelf\marginalia"
git status --short --branch
# After user confirms migration 0008 is pasted in Supabase:
curl -X POST https://marginalia-co.vercel.app/api/v1/books/backfill-covers \
  -H "Authorization: Bearer mg_WXaTY10S14gG0mBqIfuURibNIzEFl4v8"
curl -H "Authorization: Bearer mg_WXaTY10S14gG0mBqIfuURibNIzEFl4v8" \
  "https://marginalia-co.vercel.app/api/v1/books?status=finished" | head
```

**Out of scope:** No OAuth/importers, no final Android asset links file, no verified-domain email sender, no App Store/iOS packaging, no ML recommendation model beyond existing Librarian behavior.

**Last updated:** 2026-05-11

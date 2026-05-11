# Changelog

## 2026-05-11

- QA'd the live Marginalia & Co. app across landing, guest sign-in, search, pile, reading, shelf, profile, desktop/laptop/mobile layouts.
- Found live save-to-pile blocker: Supabase reported no matching `ON CONFLICT` constraint for `google_books_id`.
- Added `supabase/migrations/0006_books_google_id_full_unique.sql` to replace the partial Google Books ID unique index with a normal unique index.
- Updated search so results are annotated with the user's existing shelf status and repeat searches no longer show already-saved books as addable.
- Added `src/app/(app)/search/shelf-status.ts` and a Node regression test for shelf-status mapping.
- Made search save state per-book and replaced raw database save errors with reader-friendly messages.
- Reduced pile route work by combining pile and reading queries, switching pile user ID lookup to Supabase `getClaims()`, and adding a route loading shell.
- Added tab route prefetching to improve perceived bottom-nav responsiveness.
- Updated PWA metadata to prefer fullscreen display and set `viewportFit: "cover"`.
- Verified with `npm run lint`, `npx tsc --noEmit`, `node --test "src/app/(app)/search/shelf-status.test.ts"`, and local mobile browser checks.
- Ran live new-user QA and found conversion blockers: live `+ Pile` failed, nav symbols rendered as question marks, Profile led with API tokens, Librarian leaked server configuration copy, and `/api/v1` was not a human-friendly docs target.
- Ran a focused engineering review and chose a data-layer save fix over a UI-only workaround.
- Changed `addToPile` to use insert plus duplicate fallback so save-to-pile does not depend on a production-only `onConflict` index migration.
- Replaced fragile glyph navigation and bad separator symbols with stable text labels/copy across the app shell and key flows.
- Added an empty-shelf "Add your first book" CTA, an accessible search clear button, and a human-readable `/api` docs page.
- Moved API token creation behind "Advanced: API access" and removed user-facing `ANTHROPIC_API_KEY` fallback copy from Librarian.
- Verified the focused fix set with `npm run lint`, `npx tsc --noEmit`, `node --test "src/app/(app)/search/shelf-status.test.ts"`, `npm run build`, and Browser QA on `http://127.0.0.1:3007`.
- Pushed `codex/initial-little-alexandria-app` and opened draft PR #3: `https://github.com/radiansnail-1/marginalia-co/pull/3`.

**Last updated:** 2026-05-11

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

**Last updated:** 2026-05-11

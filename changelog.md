# Changelog

## 2026-05-13

- QA'd Marginalia production and local authenticated flows; core loop works, with launch-confidence gaps remaining around donation URL, Goodreads real CSV import, metadata enrichment/backfill, affiliate attribution dashboards, and broader real-device QA.
- Removed the Project Hail Mary production QA artifact from the test user's shelf.
- Added `missingBookMetadataPatch` and regression tests so saving a richer search result fills missing catalog metadata without overwriting existing fields.
- Updated search add-to-pile logic to hydrate stale existing catalog rows before inserting `user_books`.
- Added a staged librarian loading UI with accessible status text for shelf checking, wider-stack search, shelf merging, and final selection.
- Kept Google Books in the librarian candidate pool while tightening catalog, Google, cache/profile, and logging budgets.
- Removed runtime embedding from the blocking librarian response path to keep recommendation latency within the user-approved 5 second feel.
- Authenticated QA with `awesomebt28@gmail.com` verified librarian loading and results on desktop, laptop, and mobile. Post-fix timings were about 4.8s, 3.5s, and 3.5s, with no browser console errors.
- Verified recommendation detail open/back flow from the librarian result list.
- Passed `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Committed verified fixes as `903b695 Tighten librarian recommendations`.

**Last updated:** 2026-05-13

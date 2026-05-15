# Changelog

## 2026-05-15

- Ran a live QA pass against `https://marginalia-co.vercel.app`, covering `/home`, `/shelf`, `/pile`, `/librarian`, `/profile`, `/search`, and `/api`; no console errors were observed in exercised flows.
- Verified shelf search/filter and add-book search behavior on production while avoiding live write actions that would mutate the account.
- Reduced bookshelf spine title size from `8px` to `6.5px` and tightened letter spacing in `src/components/room/spine.tsx`.
- Added a paste-ready LLM API connection prompt to the fresh token reveal in `src/app/(app)/profile/token-panel.tsx`.
- Passed `npm test` 22/22, `npm run lint`, and `npm run build`.
- Committed verified UI changes as `655ed04 Polish spine text and API token prompt`.

## 2026-05-14

- Installed `@vercel/analytics` in the Marginalia Next.js app.
- Added the root layout import `import { Analytics } from "@vercel/analytics/next"` and rendered `<Analytics />` inside the app `<body>`.
- Verified `npx tsc --noEmit --pretty false` passes; `npm run lint` timed out after two minutes without reporting an error.
- Updated handoff state for the analytics publish scope while keeping pre-existing `PLAY.md` edits out of scope.

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

**Last updated:** 2026-05-15

# Changelog

## 2026-05-15

- Prepared Marginalia & Co. for Google Play closed testing as a Trusted Web Activity with package `com.app.marginaliaandco`.
- Updated Play release documentation in `PLAY.md` with the Vercel production domain, wrapper path, signed AAB workflow, tester guide references, and Digital Asset Links steps.
- Updated `public/.well-known/assetlinks.template.json` and `scripts/twa-assetlinks.mjs` from the stale package `com.radiansnail.marginalia` to `com.app.marginaliaandco`.
- Generated `public/.well-known/assetlinks.json` with the Play App Signing SHA-256 fingerprint `8C:E6:E0:FF:94:A9:25:13:5D:5A:EF:E6:BA:D8:71:30:EA:71:A5:B6:A5:58:B1:16:A0:C6:E5:CE:FD:67:03:81`.
- Confirmed the local asset links file is correct and that production still returns `404` until Vercel is redeployed.
- Clarified that the Android AAB does not need to be rebuilt for this assetlinks-only browser URL bar fix.
- Added click-to-copy behavior for the fresh API token LLM prompt in `src/app/(app)/profile/token-panel.tsx`.
- Added `src/lib/api/reference.ts` so the machine-readable `/api/v1` contract explicitly surfaces review support and half-star ratings.
- Added `src/lib/api/books-schema.ts` so POST `/api/v1/books` accepts half-star numeric strings, supports explicit rating/review clearing, and preserves omitted `status`, `rating`, and `review` when updating an existing shelf book.
- Added `src/lib/api/book-upsert.ts` so API book updates can match existing plain title rows when incoming Google Books metadata includes subtitles, reducing duplicate catalog rows for cases like The Trading Game, Humankind, and AI Superpowers.
- Added regression tests for the API book schema and machine-readable API reference.
- Ran QA checks for the API sync issue: local `/api/v1` surfaces review and half-star support, production `/api/v1` is still on the old contract until this branch is deployed, `npm test` passed 30/30, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, and `npm run build` passed.
- Confirmed the repo already contains `supabase/migrations/0009_half_star_ratings.sql`; if production still rejects half-stars after deploy, the production Supabase migration state needs repair.
- Committed the Play/TWA/API changes locally as `51bd3f9 Add Play asset links for TWA`.
- Previously ran a live QA pass against `https://marginalia-co.vercel.app`, covering `/home`, `/shelf`, `/pile`, `/librarian`, `/profile`, `/search`, and `/api`; no console errors were observed in exercised flows.
- Previously reduced bookshelf spine title size in `src/components/room/spine.tsx` and added a paste-ready LLM API connection prompt in `src/app/(app)/profile/token-panel.tsx`.
- Previously passed `npm test` 22/22, `npm run lint`, and `npm run build` for the UI polish changes.

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

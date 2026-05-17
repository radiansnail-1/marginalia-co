# Changelog

## 2026-05-16

- Pushed prior Play/TWA/API changes and opened draft PR #17: `https://github.com/radiansnail-1/marginalia-co/pull/17`.
- Used the Nicole/Superwall source note and CEO review to choose a Marginalia-native onboarding growth direction: Librarian interview first, then locked guide, optional Plus offer, referral invite, and rating prompt suppression.
- Added static onboarding/pricing/referral/rating mockups to `E:\2.CurrentProjects\bookshelf\design\onboarding-options.html` and linked them from the design index.
- Added Supabase migration `0015_onboarding_growth.sql` for onboarding completion/answers, prompt timestamps, referral codes, and referral events.
- Added `/invite/[code]` route to capture referral codes in a cookie before signup.
- Added growth helpers in `src/lib/growth/` for referral code normalization, share text, referral creation, claiming, qualification, and qualified counts.
- Added `/onboarding` with a real first-value flow: intent question, avoidance question, first Librarian note, locked guide, Plus offer, invite code, and rating prompt.
- Updated sign-in/callback redirects to send users to `/onboarding`; updated the app layout to redirect incomplete users to onboarding while degrading to `/home` if the migration is missing.
- Clarified that `I rated!` only suppresses the rating prompt and does not grant rewards or unlocks.
- Ran design review/polish on onboarding: reused existing `Owl` and `Letter`, matched Marginalia fonts/colors, replaced placeholder marks with inline SVG icons, rounded controls, and improved the rating illustration.
- Added referral helper tests and verified `npm test` passed 34/34, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, and `npm run build` passed after implementation and polish.
- Ran eng/QA follow-up on onboarding backend wiring: `finishOnboarding` now upserts onboarding completion before best-effort referral side effects, invalid invite codes no longer set cookies, referral normalization trims after max-length slicing, and onboarding answer cleaning moved into a tested helper.
- Added `src/lib/growth/onboarding.test.ts` and expanded referral tests; verified `npm test` passed 36/36, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, and `npm run build` passed.
- Ran focused web/TWA QA locally: sign-in returned 200, valid invite redirected with referral cookie, invalid invite redirected without a cookie, signed-out onboarding redirected to sign-in, and local `assetlinks.json` served package `com.app.marginaliaandco`.
- Ran a Xiaomi Chrome visual check for the sign-in/create-account page; it fit the phone viewport. Full signed-in onboarding QA remains pending until `0015_onboarding_growth.sql` is applied and a usable authenticated test session exists.
- Investigated production report that a newly created account skipped onboarding after PR #18 merged; live routes are deployed, but Supabase is missing `profiles.onboarding_completed_at`, `referral_codes`, and `referral_events`, so `0015_onboarding_growth.sql` must be applied.
- Investigated Browser Use QA failure; root cause is stale Codex `node_repl`/app-server helper state wedging the MCP transport, not Marginalia code. A fresh Codex thread/app restart is needed before browser UI QA can run.

## 2026-05-17

- Added permanent promo code handling for `NLBisthebestlibrary`, including promo-cookie handling, profile entitlement fields, Supabase migration `0016_permanent_promo_code.sql`, and tests.
- Removed the rating prompt dismiss path; the rating step now offers only `Give us a rating` and `I rated!`.
- Investigated signup/rating QA failures: removed the redundant post-login promo action and fixed a server-action type re-export crash; verified signup reaches onboarding and `I rated!` reaches `/home`.
- Reran QA on `http://127.0.0.1:3011` across desktop `1440x900`, laptop `1280x720`, and mobile `390x844`; `npm test -- --test-reporter=spec`, `npm run lint`, and `npm run build` passed.
- Confirmed configured Supabase still needs `0016_permanent_promo_code.sql` before the permanent promo can record entitlement columns.
- Investigated onboarding first recommendation sameness; root cause was a hard-coded first note, now replaced with an answer-aware book-cover card and tested curated selector.
- QA found and fixed a stuck remote-cover load in the onboarding first-book card by bypassing the Next image optimizer for that small curated cover image.
- Eng review: 0 architecture/code/performance issues, Browser Use verified personalization before a post-fix localhost block, status=clean_with_visual_followup.

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

**Last updated:** 2026-05-17

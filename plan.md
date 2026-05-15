# Plan

**Goal:** Finish Google Play closed testing for Marginalia & Co. and remove the browser URL bar from the Trusted Web Activity install.

**Approach:**
- Keep the Play-distributed app package fixed as `com.app.marginaliaandco`.
- Use Google Play's App signing key certificate SHA-256 for Digital Asset Links.
- Deploy the website asset link fix to Vercel; rebuild the Android AAB only when native wrapper config changes.

**Milestones:**
- [x] Build and upload the closed testing Android App Bundle.
- [x] Get the closed testing app downloadable through the Play tester opt-in flow.
- [x] Identify the browser URL bar as a failed TWA Digital Asset Links verification.
- [x] Generate `public/.well-known/assetlinks.json` with the Play App Signing SHA-256.
- [x] Add click-to-copy behavior for the fresh API token LLM prompt.
- [x] Surface reviews and half-star ratings in the public API contract.
- [x] Add a conservative title/author fallback to avoid richer Google Books duplicates for existing plain catalog rows.
- [x] Commit the Play/TWA/API changes locally.
- [ ] Push and open a draft PR for the Play/TWA/API changes.
- [ ] Deploy the website to Vercel and verify the live asset links URL returns `200` JSON.
- [ ] Uninstall/reinstall the Play test app and confirm the URL bar is gone.

## Resume State

**Status:** The Play/TWA/API fixes are committed locally and ready to push. The live URL still needs a Vercel deployment.

**Last action:** Generated `public/.well-known/assetlinks.json`, added click-to-copy behavior to the fresh API token LLM prompt, fixed the API contract so reviews and half-star ratings are visible to callers, and patched book upsert matching to avoid subtitle-driven duplicates.

**Next action:** Push branch `codex/initial-little-alexandria-app`, open a draft PR, deploy `marginalia` to Vercel, then verify `https://marginalia-co.vercel.app/.well-known/assetlinks.json`.

**Repo state:** Branch `codex/initial-little-alexandria-app` tracks `origin/codex/initial-little-alexandria-app` and is ahead by one local commit: `51bd3f9 Add Play asset links for TWA`.

**Verification:** `npm run twa:assetlinks -- --fingerprint "8C:E6:E0:FF:94:A9:25:13:5D:5A:EF:E6:BA:D8:71:30:EA:71:A5:B6:A5:58:B1:16:A0:C6:E5:CE:FD:67:03:81"` passed and wrote `public/.well-known/assetlinks.json`. Local file contents were checked and include package `com.app.marginaliaandco`. `npm run twa:verify -- --fingerprint ... --file public/.well-known/assetlinks.json` currently fails against production because the live Vercel URL still returns `404`. Latest QA: `npm test` passed 30/30, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, and `npm run build` passed. Browser Use was blocked by the local browser runtime before screenshot capture.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | - | - | No CEO review run for this release plumbing change. | unknown |
| Eng | 2026-05-15 | cleared | Low-risk config/docs change: website asset links and package-name alignment. | no |
| Design | - | - | No design review needed for Play/TWA verification plumbing. | no |
| DX | - | - | Tester instructions and Play release notes were added in the wrapper project. | no |

**Review verdict:** CLEARED

**Next review:** None required before draft PR. Re-run verification after Vercel deploy.

**Blockers / open questions:** Production `assetlinks.json` is not deployed yet. Production `/api/v1` still serves the old API contract until this branch is deployed. If live writes still reject `3.5` after deploy, apply/verify `supabase/migrations/0009_half_star_ratings.sql` in the production Supabase database. The Android AAB does not need rebuilding for the browser URL bar fix unless package ID, host URL, start URL, signing config, icons, or native wrapper settings change.

**Context pointers:**
- Key files: `public/.well-known/assetlinks.json`, `public/.well-known/assetlinks.template.json`, `scripts/twa-assetlinks.mjs`, `PLAY.md`, `src/app/(app)/profile/token-panel.tsx`, `src/lib/api/reference.ts`, `src/lib/api/books-schema.ts`, `src/lib/api/book-upsert.ts`, `src/app/api/v1/books/route.ts`
- Android wrapper project: `E:\2.CurrentProjects\bookshelf\marginalia-twa`
- Play package ID: `com.app.marginaliaandco`
- Play App Signing SHA-256: `8C:E6:E0:FF:94:A9:25:13:5D:5A:EF:E6:BA:D8:71:30:EA:71:A5:B6:A5:58:B1:16:A0:C6:E5:CE:FD:67:03:81`
- Live assetlinks URL: `https://marginalia-co.vercel.app/.well-known/assetlinks.json`

**How to resume:** `cd "E:\2.CurrentProjects\bookshelf\marginalia"; git status --short --branch; npm run twa:verify -- --fingerprint "8C:E6:E0:FF:94:A9:25:13:5D:5A:EF:E6:BA:D8:71:30:EA:71:A5:B6:A5:58:B1:16:A0:C6:E5:CE:FD:67:03:81" --url https://marginalia-co.vercel.app/.well-known/assetlinks.json`

**Out of scope:** Do not reset or recreate the Play upload key after a successful Play upload. Do not rebuild/reupload the AAB just to publish `assetlinks.json`.

**Last updated:** 2026-05-15

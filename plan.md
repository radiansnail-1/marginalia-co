# Plan

**Goal:** Ship Marginalia & Co. onboarding growth plumbing while preserving the Play/TWA release fixes already pushed in PR #17.

**Approach:**
- Keep the Google Play app as a TWA: web routes power both browser and Play app unless native billing/deep-link behavior changes.
- Gate signed-in app routes behind `/onboarding` only when the new onboarding migration is present; degrade to `/home` instead of crashing if Vercel deploys before Supabase.
- Use the Nicole/Superwall playbook selectively: first-value Librarian interview, locked guide, optional Plus offer, invite code loop, and rating prompt suppression only.
- Keep rating and referral separate: referrals can qualify toward Plus credit; `I rated!` only suppresses the rating prompt.

**Milestones:**
- [x] Build and upload the closed-testing Android App Bundle for package `com.app.marginaliaandco`.
- [x] Add `public/.well-known/assetlinks.json` with the Play App Signing SHA-256 so the TWA URL bar can disappear after deploy.
- [x] Fix API contract exposure for reviews and half-star ratings, plus safer book upsert matching.
- [x] Push Play/TWA/API changes and open draft PR #17.
- [x] Explore onboarding/pricing/referral/rating mockups in `E:\2.CurrentProjects\bookshelf\design\onboarding-options.html`.
- [x] Implement real `/onboarding`, `/invite/[code]`, referral helpers, rating prompt suppression, and Supabase migration `0015_onboarding_growth.sql`.
- [x] Run design polish so onboarding matches the Marginalia app feel using existing `Owl`, `Letter`, fonts, colors, and inline SVG icons.
- [x] Patch backend wiring so onboarding completion is the critical write, referral qualification is best-effort afterward, and invalid invite codes do not set cookies.
- [x] Run focused QA for public invite/sign-in/onboarding redirects, assetlinks, and mobile visual fit on Xiaomi Chrome.
- [ ] Apply production Supabase migrations, especially `0009_half_star_ratings.sql` if still missing and new `0015_onboarding_growth.sql`.
- [ ] Review the full signed-in onboarding flow with an actual test account after the migration is applied.
- [ ] Commit/push the onboarding/referral/rating work and update PR #17 or open a follow-up PR.
- [ ] Deploy to Vercel and verify live `assetlinks.json`, `/api/v1`, `/onboarding`, and invite links.

## Resume State

**Status:** Repo has uncommitted onboarding/referral/rating implementation work on top of pushed PR #17. Code-level verification and public-route QA are green; production migration/deploy and full signed-in onboarding QA are still pending.

**Last action:** Ran focused `qa` on the web/TWA source path and Xiaomi Chrome. Patched backend wiring in `src/app/onboarding/actions.ts`, `src/app/invite/[code]/route.ts`, `src/lib/growth/referrals.ts`, and added tested answer cleaning in `src/lib/growth/onboarding.ts`.

**Next action:** Apply/verify Supabase migration `supabase/migrations/0015_onboarding_growth.sql` locally or in production, then run the full signed-in `/onboarding` flow with a real test account.

**Repo state:** Branch `codex/initial-little-alexandria-app` tracks `origin/codex/initial-little-alexandria-app`. Latest commit is `797f937 Add Play asset links for TWA`. Dirty files are onboarding/referral/rating work: modified `src/app/(app)/layout.tsx`, `src/app/auth/callback/route.ts`, `src/app/auth/sign-in/page.tsx`, `src/proxy.ts`; new `src/app/invite/`, `src/app/onboarding/`, `src/lib/growth/`, and `supabase/migrations/0015_onboarding_growth.sql`.

**Verification:** After backend wiring patch, `npm test` passed 36/36, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, and `npm run build` passed. Focused QA on `http://127.0.0.1:3002` verified `/auth/sign-in` returns 200, `/invite/BRIAN-READS` redirects to `/auth/sign-in?ref=BRIAN-READS` and sets `marginalia_referral_code`, `/invite/a` redirects without setting a cookie, `/onboarding` redirects signed-out users to `/auth/sign-in`, and `/.well-known/assetlinks.json` includes `com.app.marginaliaandco`. Xiaomi Chrome visual QA showed the sign-in/create-account page fits the phone viewport. Full signed-in onboarding QA is still pending because migration state is unconfirmed and Browser Use could not type into the email input during the attempted account-creation flow.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-16 | directional | Nicole/Superwall playbook should be ported as tasteful first-value onboarding, share/referral, and optional paywall; avoid manipulative rating rewards. | no |
| Eng | 2026-05-16 | implementation reviewed | Website-first TWA-compatible wiring is appropriate; referral rewards must be based on verifiable account/onboarding events; rating is suppression-only. | no |
| Design | 2026-05-16 | polished | Onboarding now uses existing Marginalia fonts, `Owl`, `Letter`, brass/mahogany/parchment tokens, rounded controls, and inline icons. No generated assets required. | no |
| DX | 2026-05-15 | cleared | Play tester instructions and TWA release docs exist; production deploy/migration order still needs care. | no |

**Review verdict:** PUBLIC ROUTE QA CLEARED, NOT YET CLEARED FOR DEPLOY.

**Next review:** Run signed-in browser QA after applying `0015_onboarding_growth.sql`; consider a short policy review before enabling real purchase/reward mechanics.

**Blockers / open questions:** Production Supabase migration state is unknown. Full signed-in onboarding cannot be trusted until `0015_onboarding_growth.sql` is applied. Plus purchase buttons are intentionally non-purchasing until Google Play Billing or a TWA-compatible billing path is decided. Referral reward currently records qualified referrals but does not yet grant a real Plus entitlement because entitlement/billing tables are not implemented. The Play/TWA browser URL bar still depends on deploying `assetlinks.json`.

**Context pointers:**
- Onboarding UI/actions: `src/app/onboarding/onboarding-client.tsx`, `src/app/onboarding/actions.ts`, `src/app/onboarding/page.tsx`
- Referral/onboarding helpers/tests: `src/app/invite/[code]/route.ts`, `src/lib/growth/referrals.ts`, `src/lib/growth/referral-server.ts`, `src/lib/growth/onboarding.ts`, `src/lib/growth/referrals.test.ts`, `src/lib/growth/onboarding.test.ts`
- App gate/auth redirects: `src/app/(app)/layout.tsx`, `src/app/auth/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/proxy.ts`
- Migration: `supabase/migrations/0015_onboarding_growth.sql`
- Mockups: `E:\2.CurrentProjects\bookshelf\design\onboarding-options.html`
- PR already open for prior Play/TWA/API work: `https://github.com/radiansnail-1/marginalia-co/pull/17`
- Android wrapper project: `E:\2.CurrentProjects\bookshelf\marginalia-twa`

**How to resume:** `cd "E:\2.CurrentProjects\bookshelf\marginalia"; git status --short --branch; npm test; npx tsc --noEmit --pretty false; npm run lint; npm run build`

**Out of scope:** Do not reward ratings. Do not force users to rate before entering the room. Do not rebuild/reupload the AAB for web-only onboarding, referral, API, or assetlinks changes. Do not wire live payments until the Play Billing/TWA billing approach is chosen.

**Last updated:** 2026-05-16

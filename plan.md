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

## Investigation Notes

**2026-05-17, commit `1146edd`:** Investigated the post-promo QA issues around local browser QA, signup-to-onboarding, and the rating completion step.

**Root causes:**
- The stale `GoalTracker offline` screen was browser/test-environment state, not Marginalia code. The Marginalia repo has no service-worker registration, shell HTTP against `http://127.0.0.1:3011/auth/sign-in` returned Marginalia content with no `GoalTracker`, and a clean Browser Use tab on the rebuilt server rendered the Marginalia sign-in page.
- The signup flow stalled because `src/app/auth/sign-in/page.tsx` waited on a redundant post-login server action (`applySavedPromoCode`) before navigating to `/onboarding`. Promo claiming already happens from `finishOnboarding`, so the extra auth-boundary server action added a failure point after browser-side Supabase sign-in.
- The rating completion crash was a runtime server-action bundle bug caused by `src/app/onboarding/actions.ts` re-exporting `type OnboardingAnswers` from a `"use server"` file. Turbopack allowed build/typecheck but the server-action chunk crashed at runtime with `ReferenceError: OnboardingAnswers is not defined` when `I rated!` called `finishOnboarding`.
- The configured Supabase project still lacks `supabase/migrations/0016_permanent_promo_code.sql`: schema probe returned `ERROR 42703: column profiles.plus_unlocked_at does not exist`. The promo field can save the permanent promo cookie, but the permanent entitlement cannot be recorded until this migration is applied.

**Hypotheses tested and discarded:**
- Missing app server: discarded. A clean `next start` on `3011` returned the Marginalia page over HTTP.
- Marginalia service worker/offline cache: discarded. No service-worker registration exists in source, and the clean browser origin showed Marginalia rather than `GoalTracker`.
- Signup account creation failure: discarded. Supabase admin lookup confirmed the QA account was created and email-confirmed while the browser remained on `Just a moment...`.
- Source fix not working: discarded after finding a stale `next start` worker was still bound to `3011`; killing the actual listener and restarting from the rebuilt `.next` bundle cleared the old digest.

**Fix summary:**
- Removed the redundant `applySavedPromoCode` action and post-sign-in await from `src/app/auth/sign-in/actions.ts` and `src/app/auth/sign-in/page.tsx`; promo cookies are claimed during onboarding completion instead.
- Moved the `OnboardingAnswers` type import in `src/app/onboarding/onboarding-client.tsx` to `@/lib/growth/onboarding` and removed the server-action type re-export from `src/app/onboarding/actions.ts`.

**Verification:**
- `npm test -- --test-reporter=spec` passed 37/37.
- `npm run lint` passed.
- `npm run build` passed.
- Browser QA on `http://127.0.0.1:3011` verified signup reaches `/onboarding`, rating screen has only `Give us a rating` and `I rated!`, `I rated!` reaches `/home`, and no browser console errors appeared.
- Viewport QA captured sign-in and rating screens at desktop `1440x900`, laptop `1280x720`, and mobile `390x844` under `tmp/qa-2026-05-17-rerun/`.

**Open follow-ups:**
- Apply `supabase/migrations/0016_permanent_promo_code.sql` to the configured Supabase project before relying on `NLBisthebestlibrary` for real permanent-free entitlement.
- The Browser Use input bridge still intermittently reports `Browser Use virtual clipboard is not installed` for `fill()`/`type()` on inputs; DOM/button QA is usable, but fresh-account browser creation may need retrying or an existing session.

**2026-05-16, commit `7842de2`:** Investigated why `$qa` Browser Use could not start and every JavaScript/browser-control call failed with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`.

**Root cause:** This is a Codex desktop helper/runtime failure, not a Marginalia app failure. The `node_repl` MCP transport was bound to stale helper processes from earlier sessions/workspaces. Process inspection showed several orphaned `node_repl.exe` plus stdio `codex.exe app-server` pairs, and the active `node_repl` state directory `C:\Users\aweso\.codex\node_repl\active_execs` had no live entries. Restarting the apparent stale helper pair changed the failure from "failed to write kernel assets" to `Transport closed`, confirming the browser QA bridge itself was wedged and did not respawn inside this thread.

**Hypotheses tested:**
- Missing Marginalia dev server: discarded. The Next dev server started cleanly on `http://127.0.0.1:3000`.
- Missing browser-client plugin file: discarded. The active browser plugin file exists at `C:\Users\aweso\.codex\plugins\cache\openai-bundled\browser\0.1.0-alpha2\scripts\browser-client.mjs`.
- Missing Temp kernel assets: discarded. The kernel asset files existed under `C:\Users\aweso\AppData\Local\Temp\.tmpi9U6EQ`.
- Stale Codex helper/runtime state: confirmed. Multiple old helpers were alive, the active exec registry was empty, and killing the paired helper closed the transport instead of recovering it.

**Fix needed:** Restart the Codex desktop app or open a fresh Codex thread so the `node_repl` MCP server and browser helper spawn cleanly. If Browser Use still fails in a fresh thread, capture a Codex desktop bug with the exact error and current helper process list.

**Open follow-up:** After restarting/fresh-threading, rerun `$qa` for `http://127.0.0.1:3000/auth/sign-in`, `/invite/BRIAN-READS`, and the signed-in onboarding flow. The app code checks are still green, but browser UI QA remains blocked by the Codex tool transport.

**2026-05-16, commit `7ca32aa`:** Investigated report that a newly created production account did not enter onboarding after PR #18 was merged.

**Root cause:** The website deploy contains the onboarding routes, but the target Supabase database does not have `supabase/migrations/0015_onboarding_growth.sql` applied. A schema check against the configured Supabase project returned `column profiles.onboarding_completed_at does not exist`, and both `public.referral_codes` and `public.referral_events` were missing. Because `src/app/(app)/layout.tsx` intentionally degrades when that profile query errors, users are allowed into `/home` instead of seeing onboarding.

**Hypotheses tested:**
- Deployment missing: discarded. Live `https://marginalia-co.vercel.app/invite/BRIAN-READS` redirects to `/auth/sign-in?ref=BRIAN-READS`, and live `/onboarding` exists for signed-out users.
- Code redirect missing: discarded. Local commit `7ca32aa` redirects auth success to `/onboarding` and app layout gates incomplete profiles.
- DB migration missing: confirmed by Supabase schema check.

**Fix needed:** Apply `supabase/migrations/0015_onboarding_growth.sql` to the production Supabase project. Also apply `supabase/migrations/0009_half_star_ratings.sql` if half-star ratings still fail in production.

**Open follow-up:** After migration, create a fresh test account and verify signed-in `/onboarding` completes and writes `profiles.onboarding_completed_at`.

**Last updated:** 2026-05-17

# Plan

**Goal:** Ship a verified onboarding first-book recommendation that shows the book itself and varies with the reader's answers.

**Approach:**
- Keep the Google Play app as a TWA: web routes power both browser and Play app unless native billing/deep-link behavior changes.
- Gate signed-in app routes behind `/onboarding` only when the new onboarding migration is present; degrade to `/home` instead of crashing if Vercel deploys before Supabase.
- Keep the onboarding first recommendation instant and deterministic by using a small curated selector from the existing onboarding answers.
- Keep the heavier `/librarian` recommender separate: it remains the signed-in shelf/world candidate system.
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
- [x] Investigate why the onboarding first recommendation felt identical for everyone.
- [x] Replace the hard-coded first note with a first-book card that renders cover, title, author, year, and answer-aware reason.
- [x] Add regression tests proving different onboarding answers select different books.
- [x] Run Browser Use QA on the authenticated onboarding flow and fix the remote-cover loading issue it exposed.
- [x] Run `npm test -- --test-reporter=spec`, `npx tsc --noEmit --pretty false`, `npm run lint`, and `npm run build`.
- [ ] Publish and merge the onboarding first-book fix.
- [ ] Apply production Supabase migrations, especially `0015_onboarding_growth.sql`, `0016_permanent_promo_code.sql`, and `0009_half_star_ratings.sql` if still missing.
- [ ] After Browser Use localhost access recovers, rerun final visual QA on the onboarding result card at desktop/laptop/mobile.

## Resume State

**Status:** The onboarding first-book fix is implemented, tested, handoff-updated, and ready to publish/merge. The repo is on `main` with a focused dirty diff for this work.

**Last action:** Ran `$qa` against `http://127.0.0.1:3013/onboarding` with an authenticated browser session. Browser Use verified default answers show `The Dispossessed` and alternate answers (`Steadier` + `Over-neat productivity`) show `A Psalm for the Wild-Built`; QA also found the alternate cover could hang through Next image optimization, so `src/app/onboarding/onboarding-client.tsx` now direct-loads the curated cover image.

**Next action:** Use `github:yeet` to branch from `main`, commit the focused diff, push, open a PR, wait for checks, and merge.

**Repo state:** Branch `main` tracks `origin/main`. Latest commit is `5927097 Merge pull request #19 from radiansnail-1/codex/initial-little-alexandria-app`. Dirty files are `src/app/onboarding/onboarding-client.tsx`, new `src/lib/growth/first-recommendation.ts`, new `src/lib/growth/first-recommendation.test.ts`, plus canonical handoff updates in `plan.md`, `learnings.md`, and `changelog.md`.

**Verification:** Browser Use verified the authenticated onboarding result path before the post-rebuild browser block. `npm test -- --test-reporter=spec` passed 40/40, `npx tsc --noEmit --pretty false` passed, `npm run lint` passed, `npm run build` passed, and a direct cover probe confirmed all curated Open Library cover URLs return image content. Post-fix browser pixel verification is still blocked by Browser Use returning `net::ERR_BLOCKED_BY_CLIENT` for localhost after rebuild.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-16 | directional | Nicole/Superwall playbook should be ported as tasteful first-value onboarding, share/referral, and optional paywall; avoid manipulative rating rewards. | no |
| Eng | 2026-05-17 | clean with visual follow-up | First-book selector should stay small, deterministic, and separate from the heavier `/librarian` recommender; no architecture/code/performance blockers. | no |
| Design | 2026-05-16 | polished | Onboarding now uses existing Marginalia fonts, `Owl`, `Letter`, brass/mahogany/parchment tokens, rounded controls, and inline icons. No generated assets required. | no |
| DX | 2026-05-15 | cleared | Play tester instructions and TWA release docs exist; production deploy/migration order still needs care. | no |

**Review verdict:** CODE AND FUNCTIONAL QA CLEARED, FINAL PIXEL QA BLOCKED BY BROWSER TOOL.

**Next review:** Rerun Browser Use visual QA on the onboarding result card once localhost access recovers; no extra architecture review needed for this scoped change.

**Blockers / open questions:** Browser Use currently blocks localhost after rebuild with `net::ERR_BLOCKED_BY_CLIENT`, so final post-fix pixel QA at desktop/laptop/mobile is pending. Production Supabase still needs the onboarding/promo/half-star migrations applied. Plus purchase buttons remain intentionally non-purchasing until Google Play Billing or a TWA-compatible billing path is chosen.

**Context pointers:**
- Onboarding first recommendation: `src/lib/growth/first-recommendation.ts`, `src/lib/growth/first-recommendation.test.ts`
- Onboarding UI/actions: `src/app/onboarding/onboarding-client.tsx`, `src/app/onboarding/actions.ts`, `src/app/onboarding/page.tsx`
- Referral/onboarding helpers/tests: `src/app/invite/[code]/route.ts`, `src/lib/growth/referrals.ts`, `src/lib/growth/referral-server.ts`, `src/lib/growth/onboarding.ts`, `src/lib/growth/referrals.test.ts`, `src/lib/growth/onboarding.test.ts`
- App gate/auth redirects: `src/app/(app)/layout.tsx`, `src/app/auth/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/proxy.ts`
- Migration: `supabase/migrations/0015_onboarding_growth.sql`
- Mockups: `E:\2.CurrentProjects\bookshelf\design\onboarding-options.html`
- Android wrapper project: `E:\2.CurrentProjects\bookshelf\marginalia-twa`

**How to resume:** `cd "E:\2.CurrentProjects\bookshelf\marginalia"; git status --short --branch; npm test; npx tsc --noEmit --pretty false; npm run lint; npm run build`

**Out of scope:** Do not reward ratings. Do not force users to rate before entering the room. Do not rebuild/reupload the AAB for web-only onboarding, referral, API, or assetlinks changes. Do not wire live payments until the Play Billing/TWA billing approach is chosen.

**Last updated:** 2026-05-17

## Eng Review Notes

**2026-05-17, commit `5927097`:** Reviewed the plan to fix the Librarian first recommendation and assess the "everyone gets the same" concern.

**Step 0 scope challenge:**
- What already exists: `/librarian` already has a real server recommender in `src/lib/librarian/recommend.ts`; onboarding already stores answer shape in `src/lib/growth/onboarding.ts`; `next.config.ts` already allows Open Library cover images.
- Minimal change: add one pure onboarding first-book selector, render that book in the onboarding result step, and cover the selector with unit tests.
- Not in scope: no new embedding service, no live Google Books call during onboarding, no extra onboarding step, no changes to the `/api/v1/recommendations` contract.

**Architecture review:** 0 blocking issues. Keep the static curated onboarding selector separate from the production Librarian recommender; onboarding needs instant, deterministic first value, while `/librarian` remains the live shelf/world candidate system.

**Code quality review:** 0 blocking issues. The recommendation data lives in `src/lib/growth/first-recommendation.ts`, away from the client component, so the UI only renders the selected book.

**Test review:**

```text
CODE PATH COVERAGE
==================
[+] src/lib/growth/first-recommendation.ts
    |
    +-- selectFirstRecommendation()
        +-- [*** TESTED] default cleaned answers keep The Dispossessed
        +-- [*** TESTED] different answer pairs produce different books
        +-- [*** TESTED] output includes cover URL, year, and answer-aware reason

USER FLOW COVERAGE
==================
[+] Onboarding result step
    |
    +-- [** TESTED] intent/avoidance choices feed the selected first book through unit coverage
    +-- [GAP] visual browser screenshot of authenticated onboarding result step
```

**Performance review:** 0 issues. The selector is local, synchronous, and tiny; it adds no network dependency to onboarding.

**Failure modes:** Open Library cover images can fail or return placeholders; the page still has title/author/year/reason text. Browser QA found the Next image optimizer could hang on one remote cover locally, so the onboarding cover now uses direct image loading.

**Review summary:** Scope accepted as-is; Architecture 0 issues; Code Quality 0 issues; Test Review 0 code gaps and 1 tool-level post-fix browser retry gap; Performance 0 issues; TODOs proposed 0; critical gaps 0; outside voice skipped as unnecessary for a small localized change.

## Investigation Notes

**2026-05-17, commit `5927097`:** Investigated the report that the Librarian first recommendation shows a note instead of the book and that recommendations feel identical for everyone.

**Root cause:** The onboarding result step in `src/app/onboarding/onboarding-client.tsx` was hard-coded to show a parchment-style "first note" for `The Dispossessed`. It did not use the selected onboarding answers and did not render an actual book-cover card. The main `/librarian` page has a real server-side recommender, but the onboarding first recommendation was a static product moment, so every user saw the same first recommendation.

**Hypotheses tested and discarded:**
- Main `/librarian` card rendering was the source: discarded. `src/app/(app)/librarian/librarian-client.tsx` already renders cover/title/author/reason book rows for recommendation results.
- `/api/v1/recommendations` was returning a static book: not supported by the code path. It calls `recommend()` with user id and mood and uses shelf, signals, catalog/Google candidates, cached embeddings, and fallback diagnostics.
- Onboarding first recommendation was personalized elsewhere: discarded. The result step used literal `The Dispossessed` strings and never called a recommendation helper.

**Fix summary:**
- Added `src/lib/growth/first-recommendation.ts` with a deterministic curated selector based on onboarding `intent` and `avoid` answers.
- Replaced the onboarding parchment note in `src/app/onboarding/onboarding-client.tsx` with an actual book-cover card showing cover, title, author, year, and answer-aware reason.
- Set the onboarding cover image to load directly instead of through the Next image optimizer after Browser Use showed the alternate recommendation cover stuck at `naturalWidth: 0` in local QA.
- Added `src/lib/growth/first-recommendation.test.ts` to prove defaults remain stable and different answer pairs select different books.

**Verification:**
- Browser Use on `http://127.0.0.1:3013/onboarding` with an authenticated session verified the default path shows `Your first book`, `The Dispossessed`, cover alt text, and no browser console errors after the image loaded.
- Browser Use verified an alternate path (`Steadier` + `Over-neat productivity`) selected `A Psalm for the Wild-Built` instead of `The Dispossessed` and rendered the answer-aware reason text.
- Browser Use exposed a cover-loading bug for the alternate pick before the `unoptimized` fix; after rebuild, Browser Use became blocked from localhost with `net::ERR_BLOCKED_BY_CLIENT`, so post-fix pixel verification is tool-blocked.
- A direct cover probe confirmed all curated Open Library cover URLs return image content.
- `npm test -- --test-reporter=spec` passed 40/40.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed.
- `npm run build` passed.

**Open follow-ups:** Run a final visual authenticated onboarding pass when Browser Use localhost access recovers, especially mobile `390x844`, to confirm the direct-loaded cover card fits beautifully above the guide/free-room buttons.

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

# Plan

**Goal:** Ship Marginalia & Co. live with account-only auth, reliable first-run QA, public Play-readiness routes, and a signup path that does not depend on email/domain setup.

**Approach:**
- Keep the web app as the source of truth for the Android TWA/PWA shell.
- Keep protected reader features behind durable email/password accounts, but temporarily bypass email confirmation because there is no verified sending domain.
- Use a Supabase service-role server action to create confirmed accounts, then sign the user in from the client with their password.
- Keep the previous Resend work in git history only; the current working tree removes it from the active signup path.
- Retest live protected flows after the no-email-confirmation pivot is built, committed, pushed, and deployed.

**Milestones:**
- [x] QA live app public surfaces: landing, sign-in, API docs, `/api/v1`, manifest/icons, protected-route redirects, desktop/laptop/mobile layouts.
- [x] Fix public `/privacy` route so Play Console can reach the privacy policy.
- [x] Investigate Supabase auth email failures: built-in sender rate limit and project redirect fallback to localhost.
- [x] Fix app-side Supabase email redirect handling in committed code.
- [x] Implement Resend-based signup confirmation in commit `f6b5a39`, then decide not to use it because no verified sender domain exists.
- [x] Start pivot to no-email-confirmation signup: server action creates confirmed users with service role and client signs in immediately.
- [ ] Finish verification for the no-email-confirmation pivot by rerunning `npm run build`.
- [ ] Commit the no-email-confirmation pivot.
- [ ] Push branch and redeploy.
- [ ] Re-run live protected QA with a fresh account through search, add-to-pile, reading, finish, shelf, Librarian, profile, and API token flows.

## Resume State

**Status:** The active working tree is mid-pivot from Resend confirmation email to immediate confirmed-account signup. Lint and typecheck passed after the pivot; production build was started but intentionally aborted by the user before completion.

**Last action:** Removed the active Resend signup dependency from the working tree: `src/app/auth/sign-in/actions.ts` now exports `createConfirmedAccount`, `src/app/auth/sign-in/page.tsx` calls it and signs in immediately, `src/app/auth/confirm/route.ts` and `src/lib/email/resend.ts` are deleted, and `README.md` no longer lists Resend setup.

**Next action:** Run `npm run build`; if it passes, commit the working-tree pivot, then push/deploy and QA live protected flows.

**Repo state:** Branch `codex/initial-little-alexandria-app`, tracking origin, ahead by 3 commits: `f6b5a39 Send signup confirmations with Resend`, `3331533 Fix email confirmation redirect`, `4958184 Make privacy policy public`. Current working tree is dirty with the uncommitted no-email-confirmation pivot.

**Verification:** After the no-email-confirmation pivot, `npm run lint` passed and `npx tsc --noEmit` passed. `npm run build` was attempted after clearing stale `.next` validator files, but the user interrupted it before completion, so build status for the latest working tree is unknown. Earlier before this pivot, `npm run build` passed with the Resend implementation.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-11 | Completed in prior session | Keep scope focused on TWA, real shelf, Librarian, and API. | Partly stale after auth pivot |
| Eng | 2026-05-11 | Auth-focused review | Email rate limit is external Supabase/SMTP config; redirect bug was app plus Supabase dashboard config; no-domain path should avoid email confirmation for now. | Current for auth pivot |
| Design | 2026-05-11 | Completed in root notes | Dark-academia mobile UI remains the locked direction. | Mostly current |
| DX | - | Not run | API docs exist, but token flow still needs confirmed-account/live QA. | Unknown |

**Review verdict:** NEEDS QA after commit/deploy. The auth architecture is acceptable for current no-domain constraints, but live protected flows are not yet verified.

**Next review:** Run live QA after deploying the no-email-confirmation pivot. Run DX review before advertising `/api/v1` publicly.

**Blockers / open questions:**
- Production/Vercel must have `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`; immediate confirmed-account signup depends on it.
- Supabase migrations `0006` and `0007` still need confirmation in the live database before rating aggregates and book selections are fully safe.
- `/.well-known/assetlinks.json` is still 404 live; final Android TWA requires a real asset links file with the signing fingerprint.
- Resend API key is valid but sandboxed until a sender domain is verified, so Resend is not usable for arbitrary signup recipients right now.
- Need decide later whether to re-enable email confirmation after a domain is available.

**Context pointers:**
- App root: `E:\2. Current Projects\bookshelf\marginalia`
- Active auth files: `src/app/auth/sign-in/actions.ts`, `src/app/auth/sign-in/page.tsx`, `src/lib/supabase/service.ts`, `src/proxy.ts`
- Deleted in working tree: `src/app/auth/confirm/route.ts`, `src/lib/email/resend.ts`
- Committed auth/public-route fixes: `4958184`, `3331533`, `f6b5a39`
- Live app: `https://marginalia-co.vercel.app`
- Draft/merged PR context in root notes: PR #4 was merged; current branch has newer local commits not pushed.

**How to resume:** `cd "E:\2. Current Projects\bookshelf\marginalia" && git status --short --branch && npm run build`

**Out of scope:** No OAuth/importers, no final Android asset links file, no verified-domain email sender, no App Store/iOS packaging, no ML recommendation model beyond existing Librarian behavior.

**Last updated:** 2026-05-11

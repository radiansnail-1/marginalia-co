# Changelog

## 2026-05-11

- QA'd the live Marginalia & Co. app across landing, auth, API docs, protected redirects, PWA assets, and desktop/laptop/mobile public layouts.
- Found earlier live save-to-pile blocker caused by Supabase `ON CONFLICT` index drift; fixed search save path to insert plus duplicate fallback and added `0006_books_google_id_full_unique.sql`.
- Added shelf-status annotation for search results and a focused regression test so already-saved books do not appear addable.
- Replaced fragile glyph/question-mark UI surfaces with stable labels/copy, added first-book search CTA, hid API token creation behind advanced disclosure, and added human-readable `/api` docs.
- Forced durable account identity by removing guest sign-in, treating anonymous sessions as unauthenticated, and blocking anonymous API token creation.
- Added `0007_book_rating_aggregates.sql` and exposed `average_rating` / `rating_count` in book detail/API responses.
- Pushed earlier account/rating work to PR #3, then later root handoff noted PR #4 for public-route auth edge fixes.
- Verified public live routes after PR #4: `/api/v1` docs, unauthenticated API `401`s, manifest/icons, and protected-route redirects behaved as expected.
- Found live launch-readiness issues: `/privacy` was auth-protected and `/.well-known/assetlinks.json` was public but 404.
- Committed `4958184 Make privacy policy public`.
- Investigated auth email failures with AgentMail: Supabase public signup hit `email rate limit exceeded`; generated Supabase links fell back to `http://localhost:3000`, indicating Site URL/redirect config drift.
- Committed `3331533 Fix email confirmation redirect`, adding explicit signup redirect and safer callback failure handling.
- Implemented Resend signup confirmation in `f6b5a39 Send signup confirmations with Resend`, then tested the supplied Resend key and found it sandboxed until a sender domain is verified.
- User decided there is no domain for now; active working tree pivots away from Resend/email confirmation.
- Working tree now creates confirmed users server-side with Supabase admin in `src/app/auth/sign-in/actions.ts`, signs them in from `src/app/auth/sign-in/page.tsx`, deletes `src/app/auth/confirm/route.ts` and `src/lib/email/resend.ts`, and removes Resend setup from `README.md`.
- After the no-email-confirmation pivot, `npm run lint` and `npx tsc --noEmit` passed. `npm run build` was started but aborted by the user before completion.

**Last updated:** 2026-05-11

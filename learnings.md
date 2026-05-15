# Learnings

- **Spine typography lives in one place** - The home bookshelf spine title size is controlled in `src/components/room/spine.tsx`; changing `fontSize` and `letterSpacing` there updates the shelf spines without touching layout math.
- **Token prompt belongs at reveal time** - The full API token only exists client-side immediately after creation in `src/app/(app)/profile/token-panel.tsx`, so the LLM helper prompt must be generated there rather than on `/api` or in the token list.
- **Production QA should avoid state writes** - The live app can be safely checked through navigation, filters, search, and profile disclosure, but token creation/revocation, book additions, and Start/DNF actions mutate real account data and should wait for explicit approval.
- **Mixed working tree** - `PLAY.md` has unrelated local edits and should stay out of publish commits unless the user explicitly brings it into scope.

**Last updated:** 2026-05-15

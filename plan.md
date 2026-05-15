# Plan

**Goal:** Publish the Marginalia polish pass for production QA findings, bookshelf spine text, and the profile API token helper prompt.

**Approach:**
- Keep the UI change tightly scoped to the existing spine component and profile token panel.
- Preserve the production account by avoiding mutating live actions during QA.
- Publish only the verified feature commit and handoff files; leave the unrelated `PLAY.md` edit out of scope.

**Milestones:**
- [x] Run a live QA pass against `https://marginalia-co.vercel.app`.
- [x] Make book-spine titles smaller in `src/components/room/spine.tsx`.
- [x] Add a paste-ready LLM API connection prompt to `src/app/(app)/profile/token-panel.tsx`.
- [x] Run tests, lint, and production build.
- [x] Commit the verified UI changes as `655ed04 Polish spine text and API token prompt`.
- [ ] Push the current branch and open a draft PR.

## Resume State

**Status:** The requested UI changes are implemented, verified, and committed locally; the branch is ready to publish.

**Last action:** Updated the handoff files after committing `655ed04`, following live QA and local validation.

**Next action:** Stage only `plan.md`, `learnings.md`, and `changelog.md`, commit the handoff update, push branch `codex/initial-little-alexandria-app`, and open a draft PR.

**Repo state:** Branch `codex/initial-little-alexandria-app` tracks `origin/codex/initial-little-alexandria-app` and is ahead by `655ed04` before this handoff update. `PLAY.md` is modified and intentionally out of scope.

**Verification:** Live QA exercised `/home`, `/shelf`, `/pile`, `/librarian`, `/profile`, `/search`, and `/api`; shelf search/filter and book search worked; no console errors were observed in exercised flows. `npm test` passed 22/22, `npm run lint` passed, and `npm run build` passed.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | - | - | No CEO review log found for this narrow UI polish. | unknown |
| Eng | 2026-05-15 | cleared | Low-blast-radius frontend change: isolated spine typography plus token-panel prompt copy. | no |
| Design | - | - | No formal design review run; visual QA found the smaller spine text appropriate at shelf scale. | unknown |
| DX | - | - | No developer-facing workflow change beyond clearer API onboarding copy for users. | no |

**Review verdict:** CLEARED

**Next review:** None required before draft PR for this narrow polish pass.

**Blockers / open questions:** None. Production token creation, revocation, Start/DNF, and add-book writes were intentionally skipped to avoid mutating the live account.

**Context pointers:**
- Key files: `src/components/room/spine.tsx:74`, `src/app/(app)/profile/token-panel.tsx:15`
- Repo context: `655ed04 Polish spine text and API token prompt`, dirty state only from this handoff update plus unrelated `PLAY.md`.
- External: live app `https://marginalia-co.vercel.app`

**How to resume:** `cd "E:\2.CurrentProjects\bookshelf\marginalia"; git status --short --branch; npm test; npm run lint; npm run build`

**Out of scope:** Do not stage `PLAY.md` unless the user explicitly asks. Do not mutate production reading data during QA without explicit approval.

**Last updated:** 2026-05-15

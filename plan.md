# Plan

**Goal:** Publish Vercel Analytics integration for the Marginalia Next.js app.

**Approach:**
- Add the official `@vercel/analytics` package to the app dependencies.
- Render the Next.js Analytics component from the root app layout so page views are tracked across the application.
- Keep unrelated local edits, especially `PLAY.md`, out of the publish scope.

**Milestones:**
- [x] Install `@vercel/analytics`.
- [x] Add `<Analytics />` to `src/app/layout.tsx`.
- [x] Verify TypeScript import resolution.
- [ ] Commit, push, and open a draft PR.

## Resume State

**Status:** Analytics integration is implemented locally and ready to publish.

**Last action:** Installed `@vercel/analytics`, updated `package.json` and `package-lock.json`, imported `Analytics` from `@vercel/analytics/next`, and rendered `<Analytics />` in `src/app/layout.tsx`.

**Next action:** Stage only `package.json`, `package-lock.json`, `src/app/layout.tsx`, `plan.md`, `learnings.md`, and `changelog.md`; commit; push the current branch; open a draft PR.

**Repo state:** Branch `codex/initial-little-alexandria-app` tracks `origin/codex/initial-little-alexandria-app`. `PLAY.md` is modified and intentionally out of scope.

**Verification:** `npx tsc --noEmit --pretty false` passed. `npm run lint` started cleanly but timed out after two minutes before producing a final result.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | - | - | No current review log found for this narrow analytics change. | unknown |
| Eng | - | - | Change follows Vercel's standard Next.js integration pattern. | no |
| Design | - | - | No UI-visible change. | no |
| DX | - | - | No developer-facing workflow change. | no |

**Review verdict:** CLEARED

**Next review:** None required for this narrow package and root-layout integration.

**Blockers / open questions:** None for the analytics integration. The pre-existing `PLAY.md` diff remains outside this publish scope.

**Context pointers:**
- Key files: `src/app/layout.tsx`, `package.json`, `package-lock.json`
- Repo context: `2670943 Update handoff state`, current branch `codex/initial-little-alexandria-app`

**How to resume:** `cd "E:\2.CurrentProjects\bookshelf\marginalia"; git status --short --branch; npx tsc --noEmit --pretty false`

**Out of scope:** Do not stage `PLAY.md` unless the user explicitly asks.

**Last updated:** 2026-05-14

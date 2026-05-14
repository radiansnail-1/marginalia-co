# Learnings

- **Vercel Analytics location** - For this Next.js App Router project, analytics belongs in `src/app/layout.tsx` so it is mounted once at the root and covers the full app.
- **Analytics dependency** - The app did not previously include `@vercel/analytics`; adding the package is required for `import { Analytics } from "@vercel/analytics/next"` to type-check and bundle.
- **Mixed working tree** - `PLAY.md` has unrelated local edits and should stay out of analytics commits unless the user explicitly brings it into scope.

**Last updated:** 2026-05-14

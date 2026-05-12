# Marginalia & Co.

Cozy dark-academia reading tracker. Singapore-first, Android-first.

See `../plan.md` for the full build plan and `../design/` for the locked mockups.

## Stack
- Next.js 16 (App Router, Turbopack), installable as a PWA and Play-ready through a Trusted Web Activity wrapper
- Supabase (Auth + Postgres + Storage)
- Google Books (search) + Open Library (covers)
- Shopee Singapore affiliate (`/lib/books/shopee.ts`)
- Tailwind v4, framer-motion, zod

## Setup
1. `cp .env.local.example .env.local` and fill in keys.
2. Create a Supabase project, paste URL + anon key into `.env.local`.
3. Add `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) for server-side Auth/admin flows.
4. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
5. `npm install && npm run dev`.

## World Recommendations

The Librarian is a hybrid recommender:

- cached book embeddings provide semantic "vibe" matching
- the user's own ratings weight the taste profile
- low ratings/abandoned books act as negative taste signals
- shared `average_rating`/`rating_count` add a small quality boost
- normal metadata still ranks candidates when a vector is missing

Embeddings are provider-agnostic as long as the endpoint is OpenAI-compatible. OpenAI is the default, but Qwen/DashScope or another compatible provider can be used by changing the base URL and model:

```bash
EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=256
EMBEDDING_MAX_RUNTIME_TEXTS=6
```

Legacy `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_EMBEDDING_MODEL`, and `OPENAI_EMBEDDING_DIMENSIONS` env vars still work. Runtime embedding is capped by `EMBEDDING_MAX_RUNTIME_TEXTS`; set it to `0` for cached-only recommendations. The recommended charity-safe setup is to pre-embed a seed catalog, let the app rank from cached vectors, and only enable capped cache-on-miss embedding if a small monthly budget is acceptable.

Pre-embed the shared book catalog before launch:

```bash
npm run preembed:books -- --limit=10000 --batch=10
```

Use `--dry-run` to count stale/missing vectors without calling the provider.

## Mobile install / Google Play
- Web install works from the deployed HTTPS URL via Add to Home Screen.
- Google Play distribution should use a TWA shell around the deployed PWA; see `PLAY.md`.
- Play Console requires a production URL, app icon, screenshots, data safety answers, privacy policy URL, and a signed Android App Bundle.

## Affiliate links
- Book detail pages use a hybrid affiliate block: Bookshop, Shopee, Lazada, Amazon, Kobo, and Audible.
- Defaults are plain search links; add approved tracking IDs/templates through env vars.
- See `AFFILIATES.md` for the provider strategy and template format.

## License and community request
- Code is released under the MIT License unless a file says otherwise.
- If you use this project or build on top of it, I hope you will donate a portion of what you gain to effective charities or local community causes. This is a request, not a license condition.

## Routes
- `/` - landing → redirects to `/home` when signed in
- `/auth/sign-in` - email/password account creation and sign-in
- `/(app)/home` - the Room (bookshelf + coffee table)
- `/(app)/pile` - TBR
- `/(app)/librarian` - weekly pick + mood chips
- `/(app)/profile` - goal ring + stats
- `/(app)/books/[id]` - book detail w/ Shopee SG affiliate CTA

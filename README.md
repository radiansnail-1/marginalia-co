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

Seed, then pre-embed the shared book catalog before launch:

```bash
npm run seed:books -- --dry-run
npm run seed:books
npm run preembed:books -- --limit=10000 --batch=10
```

Use `--dry-run` to count inserts or stale/missing vectors without calling the provider. To guarantee your existing shelf is included in the seed catalog, set `MARGINALIA_API_TOKEN` locally before running `seed:books`; the script reads `/api/v1/books`, prepends those books to `data/curated-books.json`, dedupes by title+author, and inserts only missing catalog rows.

For only finished/read books:

```bash
npm run seed:books -- --dry-run --status=finished
npm run seed:books -- --status=finished
```

Apply `supabase/migrations/0012_book_descriptions.sql` before seeding blurbs.

To seed the Kaggle Goodreads archive downloaded to `C:\Users\aweso\Downloads\archive.zip`:

```bash
npm run seed:goodreads -- --list-only --limit=20
npm run seed:goodreads -- --dry-run --limit=10000
npm run seed:goodreads -- --limit=10000
```

`seed:goodreads` reads `goodreads_cleaned.csv` from the zip, prepends your API shelf when `MARGINALIA_API_TOKEN` is set, and dedupes by title+author without calling Google Books or OpenAI.

To backfill real sourced descriptions before embedding, run the enrichment pass. It searches Google Books first, then Open Library, accepts only confident title+author matches, and runs three books at a time by default:

```bash
npm run enrich:descriptions -- --dry-run --limit=100
npm run enrich:descriptions -- --limit=10000 --concurrency=3
```

When a description is updated, cached embeddings for that row are cleared so the next `preembed:books` run refreshes the vector from the richer text.

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

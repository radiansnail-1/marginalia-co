# Marginalia & Co.

Marginalia & Co. is a cozy, mobile-first reading tracker with a tiny AI-assisted Librarian that recommends a few books at a time instead of turning discovery into an infinite feed.

The project is open source under MIT. The hosted Marginalia deployment uses maintainer-owned Supabase/Vercel/OpenAI credentials; contributors should run their own local Supabase project unless they have been explicitly invited onto the production project.

## Stack

- Next.js 16 App Router
- Supabase Auth + Postgres
- Google Books search + Open Library covers
- Cached OpenAI-compatible embeddings for recommendations
- Tailwind v4, framer-motion, zod
- PWA-first, with a future Google Play/TWA path

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create an env file:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

4. Apply migrations in order from `supabase/migrations`.

5. Start the app:

```bash
npm run dev
```

## Recommendations

The Librarian uses a hybrid recommender:

- cached book embeddings for semantic similarity
- the reader's own ratings as positive taste weight
- low ratings and abandoned books as negative taste signals
- shared aggregate ratings as a small quality boost
- metadata fallback when vectors are missing

Runtime embedding calls are capped by `EMBEDDING_MAX_RUNTIME_TEXTS`. For production, set it to `0` and pre-embed the catalog:

```bash
npm run preembed:books -- --dry-run --limit=10000
npm run preembed:books -- --limit=10000 --batch=10
```

The embedding client is OpenAI-compatible. OpenAI works by default; other compatible providers can be used by changing `EMBEDDING_BASE_URL` and `EMBEDDING_MODEL`.

Legacy `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_EMBEDDING_MODEL`, and `OPENAI_EMBEDDING_DIMENSIONS` env vars still work. Runtime embedding is capped by `EMBEDDING_MAX_RUNTIME_TEXTS`; set it to `0` for cached-only recommendations.

To backfill sourced descriptions before embedding, run the enrichment pass. It searches Google Books first, then Open Library, accepts only confident title+author matches, and runs three books at a time by default:

```bash
npm run enrich:descriptions -- --dry-run --limit=100
npm run enrich:descriptions -- --limit=10000 --concurrency=3
```

Launch checklist for the Librarian brain:

```bash
npm run enrich:descriptions -- --limit=10000 --concurrency=3
npm run preembed:books -- --dry-run --limit=10000
npm run preembed:books -- --limit=10000 --batch=10
npm run verify:brain -- --limit=10000
```

After the data checks are green, confirm `supabase/migrations/0013_librarian_learning.sql` and `supabase/migrations/0014_book_embedding_summaries.sql` are applied in the target Supabase project, then run browser QA for search partial results, Goodreads import preview/commit, ISBN manual fallback, DNF from pile/reading, Librarian actions, and mobile layout before release.

## Contributing

Good first areas:

- search quality for non-English and obscure books
- Goodreads/StoryGraph import UX using user-owned exports
- mobile QA and accessibility
- recommendation explanations that are helpful but spoiler-safe
- PWA/TWA packaging polish

Please do not commit secrets, personal exports, generated embeddings, private catalog dumps, or service-role credentials. Use `.env.local` for local secrets.

## License and Community Request

Code is released under the MIT License unless a file says otherwise.

If you use this project or build on top of it, I hope you will donate a portion of what you gain to effective charities or local community causes. This is a request, not a license condition.

## Routes

- `/` - landing, redirects signed-in users to `/home`
- `/auth/sign-in` - email/password account creation and sign-in
- `/home` - room view
- `/pile` - TBR
- `/reading` - current reading
- `/shelf` - collection
- `/search` - add books
- `/librarian` - recommendations
- `/profile` - profile, stats, and API token management

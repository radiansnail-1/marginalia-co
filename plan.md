# Plan

**Goal:** Deploy the current Marginalia & Co. branch with the hybrid cached Librarian recommender, then pre-embed the live book catalog and launch in cached-only runtime mode.

**Approach:**
- Keep the mobile-first dark-academia reading app as the primary product surface.
- Make the Librarian a hybrid recommender: cached book embeddings for semantic similarity, user ratings/reviews for personal taste weight, abandoned/low-rated books as negative signal, and global rating aggregates as a small quality boost.
- Keep OpenAI embeddings optional at runtime. Pre-embed the catalog before launch; run production with `EMBEDDING_MAX_RUNTIME_TEXTS=0` unless cache-on-miss is intentionally enabled.
- Keep private review text out of shared book embeddings. Shared vectors are based on book metadata only.
- Publish through the existing GitHub/Vercel path, then run production QA after deploy.

**Milestones:**
- [x] Add half-star rating support through app actions/API and migration `0009_half_star_ratings.sql`.
- [x] Add embedding cache columns through migration `0010_book_embeddings.sql`.
- [x] User reports migration `0010_book_embeddings.sql` has been applied to Supabase.
- [x] User reports OpenAI embedding env vars have been added to deployment.
- [x] Refactor Librarian into cached hybrid ranking with metadata fallback and capped runtime embedding.
- [x] Add provider-agnostic embedding config and pre-embed script.
- [x] Confirm dry-run can see live embedding columns: 60 of 60 scanned books need vectors.
- [ ] Commit/push current branch and open/update the draft PR.
- [ ] Let Vercel deploy the branch/main target after merge or PR deployment.
- [ ] Run the real pre-embed command against the live catalog.
- [ ] Keep launch runtime at `EMBEDDING_MAX_RUNTIME_TEXTS=0`, then production-QA `/librarian`.

## Resume State

**Status:** Hybrid recommender implementation is complete locally. Lint and TypeScript pass. Supabase now exposes embedding columns; dry-run reports 60 books need embeddings.

**Last action:** Fixed the pre-embed script so `--dry-run` exits cleanly on Windows, then reran `node scripts/preembed-books.mjs --dry-run --limit=10000` successfully.

**Next action:** Publish the current dirty branch with the GitHub yeet workflow, then run `npm run preembed:books -- --limit=10000 --batch=64` locally after deploy/env confirmation.

**Repo state:** Inner repo `marginalia/` is on `codex/initial-little-alexandria-app`, ahead of origin by 1 commit with a dirty working tree. Current changes span the polish/legal/API/recommender pass plus handoff updates.

**Verification:**
- `npm run lint` PASS on 2026-05-12.
- `npx tsc --noEmit` PASS on 2026-05-12.
- `node scripts/preembed-books.mjs --dry-run --limit=10000` PASS on 2026-05-12, reporting 60 books needing embeddings out of 60 scanned.
- Earlier local browser QA passed against `http://localhost:3000`; production QA still needed after deploy.

## Review Status

| Review | Last run | Status | Findings | Stale? |
|--------|----------|--------|----------|--------|
| CEO | 2026-05-12 | Informal strategy discussion | Use embeddings as the practical first recommender path; avoid full custom ML training for now. | Current |
| Eng | 2026-05-12 | Plan-eng review + implementation | Hybrid cached recommender is the right shape; avoid live unbounded embedding calls. | Current |
| Design | 2026-05-12 | Browser diff comments addressed | Local mobile UI polish completed; deployed app still needs fresh QA. | Current locally |
| DX | - | Not run | API docs exist, but no formal onboarding/DX audit yet. | Unknown |

**Review verdict:** LOCAL CHECKS CLEARED; PRODUCTION QA NEEDED after deploy and pre-embed.

**Next review:** Run browser QA against production after deploy, focusing on `/librarian`, `/search`, `/books/[id]`, API responses, and timing headers.

**Blockers / open questions:**
- Real embedding run still needs a valid local `EMBEDDING_API_KEY`/OpenAI key in `.env.local`.
- Production should launch with `EMBEDDING_MAX_RUNTIME_TEXTS=0` to avoid runtime spend surprises.
- Affiliate approvals and final tracking IDs are still pending.
- Android asset links/TWA packaging remains out of this pass.

**Context pointers:**
- App root: `E:\2. Current Projects\bookshelf\marginalia`
- Recommender: `src/lib/librarian/recommend.ts`, `src/lib/librarian/embeddings.ts`
- Pre-embed script: `scripts/preembed-books.mjs`
- Migration: `supabase/migrations/0010_book_embeddings.sql`
- Runtime docs: `README.md`
- API route: `src/app/api/v1/recommendations/route.ts`
- Live app: `https://marginalia-co.vercel.app`

**How to resume:**
```bash
cd "E:\2. Current Projects\bookshelf\marginalia"
git status --short --branch
npm run preembed:books -- --dry-run --limit=10000
```

**Out of scope:** Full custom recommender training, vector DB/pgvector migration, automatic background job queue, final affiliate tracking IDs, Android TWA packaging, and formal DX review.

**Last updated:** 2026-05-12

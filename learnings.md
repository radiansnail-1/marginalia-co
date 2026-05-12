# Learnings

- **Cached embeddings are the launch-safe recommender path** - Pre-embed the shared book catalog and run production with `EMBEDDING_MAX_RUNTIME_TEXTS=0` so users do not trigger surprise OpenAI spend.
- **Hybrid ranking beats pure embeddings** - The Librarian should combine semantic similarity, user ratings, low-rating/abandoned negative signals, subjects/metadata, and global `average_rating`/`rating_count` rather than trusting one signal.
- **Private reviews must not leak into shared vectors** - User reviews can influence private taste weighting, but shared `books.embedding` should only come from book metadata such as title, author, year, page count, and subjects.
- **Embedding migrations must degrade cleanly** - If production lacks `0010_book_embeddings.sql`, shelf loading must still fall back to non-embedding columns so a populated shelf does not appear empty.
- **Dry-run should not require paid credentials** - `scripts/preembed-books.mjs --dry-run` loads local env, checks Supabase cache state, and counts stale vectors without requiring `EMBEDDING_API_KEY`.
- **Deployed and local can drift** - Treat local QA as provisional until the current branch is deployed; production needs a fresh QA pass after Vercel picks up the published changes.
- **Affiliate links are not all general links** - Bookshop/Shopee can start as generic/search links, but Amazon/Kobo/Awin/Audible usually need approved product/deep-link tracking details before commission tracking is real.
- **Legal charity language must be nonbinding** - The MIT license can sit beside a charity request, but the request cannot become a license condition without ceasing to be plain MIT.

**Last updated:** 2026-05-12

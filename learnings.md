# Learnings

- **The Librarian is a pipeline, not a widget** - Recommendation quality depends on enrichment, fresh embedding hashes, candidate source availability, learning tables, and fallback copy. UI health alone does not prove the brain is working.
- **Precompute first, cache misses carefully** - For a charity-cost launch, enrich and pre-embed the shared catalog before launch, then keep runtime embedding disabled or tightly capped unless cache-on-miss spend is intentional.
- **Diagnostics prevent fake personalization** - `/librarian` should expose internal candidate counts to the app result so QA can tell catalog/world picks from shelf fallback instead of trusting pretty copy.
- **Provider timeouts need real aborts** - Resolving a fallback promise is not enough if upstream Google/Open Library fetches keep running. Search and recommendation provider calls need actual abort signals or bounded request timers.
- **Search needs multiple catalogs and partial success** - For foreign-language, obscure, or slow-provider cases, local catalog and Open Library results should still appear when Google is down or timed out.
- **Goodreads import should enrich at commit time** - CSV import can stay user-owned while still resolving ISBN/title metadata through existing providers so imported shelves are not full of bare rows.
- **Schema assumptions must match migrations** - Do not insert fields like `books.language` unless migrations define them. TypeScript can pass while Supabase rejects the write at runtime.
- **DNF belongs on the reading/table flow** - DNF should preserve history, close open sessions, leave current reading/pile, and show in the collection as `DNF / set aside`.
- **Reading-session writes need ownership checks** - Updating sessions by session id alone can cross user boundaries. Always verify the backing `user_books` row belongs to the current user.
- **TWA readiness must be generated from the final fingerprint** - Digital Asset Links verification needs an exact static `/.well-known/assetlinks.json` with the final signing SHA-256. Keep the template as source and do not fake production readiness.
- **Authenticated browser QA needs a test account** - The protected app routes cannot be meaningfully browser-tested from a fresh local session without either existing credentials or explicit approval to create a throwaway Supabase user.
- **Dirty worktrees need deliberate staging** - The active branch is richer than public `main`. Inspect `git status`, avoid reverting unrelated changes, and promote staged slices rather than dumping everything into public main.
- **The room shelf is a preview, not a database view** - At Xiaomi/mobile width the home shelf can show 109 spines after row caps. Heavy readers and Goodreads import users need explicit overflow affordances and a scalable collection index rather than a silent visual truncation.

**Last updated:** 2026-05-12

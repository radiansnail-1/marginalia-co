# Learnings

- **Librarian latency budget** - Individual timeouts are not enough when optional work stacks. `src/lib/librarian/recommend.ts` keeps Google Books in the candidate pool but bounds catalog, Google, cache/profile, and logging work so the UI can return within the intended 5 second feel.
- **Runtime embeddings are not request-critical** - Cached embeddings and metadata scoring are enough for the interactive librarian path. Runtime embedding on cache miss can push the request past the product target and should run offline or outside the blocking response path.
- **Loading state matters** - `src/app/(app)/librarian/librarian-client.tsx` uses an accessible `role=status` loading scene so a multi-second recommendation request feels intentional: checking shelf, reading wider stacks, merging shelves, choosing books.
- **Search metadata backfill** - Existing catalog rows can be stale even when richer search results have descriptions, ISBNs, covers, or subjects. `missingBookMetadataPatch` fills missing fields only and clears stale embedding fields when description text changes.
- **Authenticated QA account** - The test account `awesomebt28@gmail.com` with password `testaccount` signs in locally and currently has sparse/empty visible shelf state, which is useful for low-data librarian QA.
- **Browser QA evidence** - Browser Use screenshot capture may time out in this dev setup. DOM snapshots, visible DOM, console logs, and measured elapsed times were reliable enough to verify the librarian flow.
- **Production artifact cleanup** - The Project Hail Mary QA shelf artifact was removed from the production account after smoke testing; avoid leaving QA books on the user shelf.
- **Affiliate links** - Production book pages show Bookshop.org links through `bookshop.org/a/124113/...` and Shopee links through `s.shopee.sg/an_redir` with `affiliate_id=14382220020&sub_id=marginalia`.

**Last updated:** 2026-05-13

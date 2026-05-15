# Learnings

- **AAB is not needed for assetlinks-only fixes** - The browser URL bar in a Play-installed TWA is controlled by Digital Asset Links verification between the website and the Play-signed Android app. Updating `public/.well-known/assetlinks.json` and redeploying the website is enough when the package ID and wrapper config are unchanged.
- **Use Play App Signing SHA-256** - For Play installs, `assetlinks.json` must use the SHA-256 from Play Console's App signing key certificate, not the local upload key certificate. The current Play signing fingerprint is `8C:E6:E0:FF:94:A9:25:13:5D:5A:EF:E6:BA:D8:71:30:EA:71:A5:B6:A5:58:B1:16:A0:C6:E5:CE:FD:67:03:81`.
- **Package ID is fixed for this app** - The Play package and TWA verification package are `com.app.marginaliaandco`; old references to `com.radiansnail.marginalia` are stale.
- **Live verification requires deployment** - Local generation can pass, but TWA verification on the device will fail until `https://marginalia-co.vercel.app/.well-known/assetlinks.json` returns `200` JSON from Vercel.
- **API callers trust `/api/v1`** - If a field is supported by route code but missing from the machine-readable reference, LLM/tool callers treat it as unsupported. Keep `src/lib/api/reference.ts` in sync with `src/app/api/v1/books/route.ts`.
- **Book updates should preserve omitted fields** - POST `/api/v1/books` is used for safe updates from tools; omitted `status`, `rating`, and `review` should preserve existing values on updates instead of resetting them.
- **Google Books subtitles can create duplicates** - Existing plain rows such as `The Trading Game` can miss exact title matching when incoming metadata uses a richer subtitle. Use conservative normalized title/author matching before inserting a new catalog row.
- **Half-star writes need DB migration 0009** - Route validation can accept `4.5`, but production still needs `supabase/migrations/0009_half_star_ratings.sql` applied so `user_books.rating` is `numeric(2,1)` with the half-star check constraint.
- **Do not expose or reuse pasted signing passwords** - Any upload key password pasted into chat should be treated as compromised; reset only before the first successful Play upload, then preserve the Play upload key.

**Last updated:** 2026-05-15

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

## Mobile install / Google Play
- Web install works from the deployed HTTPS URL via Add to Home Screen.
- Google Play distribution should use a TWA shell around the deployed PWA; see `PLAY.md`.
- Play Console requires a production URL, app icon, screenshots, data safety answers, privacy policy URL, and a signed Android App Bundle.

## Affiliate links
- Book detail pages use a hybrid affiliate block: Bookshop, Shopee, Lazada, Amazon, Kobo, and Audible.
- Defaults are plain search links; add approved tracking IDs/templates through env vars.
- See `AFFILIATES.md` for the provider strategy and template format.

## Routes
- `/` - landing → redirects to `/home` when signed in
- `/auth/sign-in` - email/password account creation and sign-in
- `/(app)/home` - the Room (bookshelf + coffee table)
- `/(app)/pile` - TBR
- `/(app)/librarian` - weekly pick + mood chips
- `/(app)/profile` - goal ring + stats
- `/(app)/books/[id]` - book detail w/ Shopee SG affiliate CTA

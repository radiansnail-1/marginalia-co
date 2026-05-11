# Marginalia & Co.

Cozy dark-academia reading tracker. Singapore-first, Android-first.

See `../plan.md` for the full build plan and `../design/` for the locked mockups.

## Stack
- Next.js 16 (App Router, Turbopack) wrapped via Capacitor for Android / iOS
- Supabase (Auth + Postgres + Storage)
- Google Books (search) + Open Library (covers)
- Shopee Singapore affiliate (`/lib/books/shopee.ts`)
- Tailwind v4, framer-motion, zod

## Setup
1. `cp .env.local.example .env.local` and fill in keys.
2. Create a Supabase project, paste URL + anon key into `.env.local`.
3. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
4. `npm install && npm run dev`.

## Routes
- `/` — landing → redirects to `/home` when signed in
- `/auth/sign-in` — magic link + Google OAuth
- `/(app)/home` — the Room (bookshelf + coffee table)
- `/(app)/pile` — TBR
- `/(app)/librarian` — weekly pick + mood chips
- `/(app)/profile` — goal ring + stats
- `/(app)/books/[id]` — book detail w/ Shopee SG affiliate CTA

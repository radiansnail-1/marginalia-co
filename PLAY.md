# Google Play Playbook for Marginalia & Co.

Marginalia & Co. should ship to Google Play as a Trusted Web Activity (TWA) around the deployed PWA. The app uses Next.js server routes and Supabase, so a static Capacitor bundle is not the right first wrapper unless the app is later refactored around a hosted API.

## Current Play Prep

- App name: `Marginalia & Co.`
- Suggested package name: `com.radiansnail.marginalia`
- Repo slug: `marginalia-co`
- Web manifest: `public/manifest.webmanifest`
- Icons checked in:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/apple-touch-icon.png`
  - `public/icons/maskable-512.png`
  - `public/icons/play-store-icon-512.png`
- Privacy policy route: `/privacy`

## Requirements Before First Upload

1. Deploy the app to a stable HTTPS production domain.
2. Apply Supabase migrations in production.
3. Add production env vars to the host.
4. Create a Google Play Console developer account.
5. Build a TWA Android App Bundle that targets Android 15 / API 35 or newer. Google Play blocks new phone app submissions that target older API levels.
6. Host a real `/.well-known/assetlinks.json` on the production domain using the final package name and signing-key SHA-256 fingerprint.
7. Fill in Play Console store listing, screenshots, app category, data safety, and privacy policy URL.

## Build the TWA

Run this outside the app repo after the production deployment exists:

```bash
npm install -g @bubblewrap/cli
mkdir ../marginalia-twa
cd ../marginalia-twa
bubblewrap init --manifest=https://YOUR-DOMAIN/manifest.webmanifest
bubblewrap build
bubblewrap fingerprint
```

Use these values during `bubblewrap init` unless you intentionally change them:

```text
Application name: Marginalia & Co.
Short name: Marginalia
Package ID: com.radiansnail.marginalia
Start URL: /home
Display mode: standalone
Orientation: portrait
Theme color: #1a0905
Background color: #1a0905
Icon: public/icons/play-store-icon-512.png
```

## Digital Asset Links

After `bubblewrap fingerprint`, copy `public/.well-known/assetlinks.template.json` to `public/.well-known/assetlinks.json` and replace `YOUR:SHA256:FINGERPRINT:HERE`.

The file must be reachable at:

```text
https://YOUR-DOMAIN/.well-known/assetlinks.json
```

Without a valid asset links file, Android can show browser chrome instead of a clean app shell.

## Upload Flow

1. In Play Console, create a new app named `Marginalia & Co.`.
2. Upload the signed `.aab` from Bubblewrap to Internal testing first.
3. Add yourself as a tester and install from the testing link on your Android phone.
4. Verify login, search, pile, reading session, finish flow, shelf/profile, and icon appearance.
5. Promote from internal testing only after the production URL, Supabase save behavior, and privacy policy are confirmed.

## Still Needed

- Production domain decision.
- Store screenshots from a real phone viewport.
- Final privacy copy/legal review.
- Final data safety answers.
- Real Shopee affiliate URL.

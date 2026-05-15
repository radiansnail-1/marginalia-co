# Google Play Playbook for Marginalia & Co.

Marginalia & Co. should ship to Google Play as a Trusted Web Activity (TWA) around the deployed PWA. The app uses Next.js server routes and Supabase, so a static Capacitor bundle is not the right first wrapper unless the app is later refactored around a hosted API.

## Current Play Prep

- App name: `Marginalia & Co.`
- Package name: `com.app.marginaliaandco`
- Repo slug: `marginalia-co`
- Production domain: `https://marginalia-co.vercel.app`
- Web manifest: `public/manifest.webmanifest`
- Icons checked in:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/apple-touch-icon.png`
  - `public/icons/maskable-512.png`
  - `public/icons/play-store-icon-512.png`
- Privacy policy route: `/privacy`
- TWA wrapper project: `E:\2.CurrentProjects\bookshelf\marginalia-twa`
- Unsigned Android App Bundle built at `E:\2.CurrentProjects\bookshelf\marginalia-twa\app\build\outputs\bundle\release\app-release.aab`
- TWA verification is blocked until the final Play App Signing SHA-256 fingerprint exists and `public/.well-known/assetlinks.json` has been generated from `public/.well-known/assetlinks.template.json`.

## Requirements Before First Upload

1. Deploy the app to a stable HTTPS production domain. Current domain: `https://marginalia-co.vercel.app`.
2. Apply Supabase migrations in production.
3. Add production env vars to the host.
4. Create a Google Play Console developer account. Done per owner.
5. Build a signed TWA Android App Bundle that targets Android 15 / API 35 or newer. Google Play blocks new phone app submissions that target older API levels.
6. Host a real `/.well-known/assetlinks.json` on the production domain using the final package name and signing-key SHA-256 fingerprint.
7. Fill in Play Console store listing, screenshots, app category, data safety, and privacy policy URL.

## Build the TWA

The generated wrapper lives outside the app repo:

```text
E:\2.CurrentProjects\bookshelf\marginalia-twa
```

The current unsigned build command is:

```powershell
cd "E:\2.CurrentProjects\bookshelf\marginalia-twa"
.\scripts\build-unsigned-aab.ps1
```

It produced:

```text
E:\2.CurrentProjects\bookshelf\marginalia-twa\app\build\outputs\bundle\release\app-release.aab
```

That file proves the wrapper builds, but it is unsigned and cannot be the final Play upload.

To generate from scratch, run this outside the app repo after the production deployment exists:

```bash
npm install -g @bubblewrap/cli
mkdir ../marginalia-twa
cd ../marginalia-twa
bubblewrap init --manifest=https://marginalia-co.vercel.app/manifest.webmanifest
bubblewrap build
bubblewrap fingerprint
```

Use these values during `bubblewrap init` unless you intentionally change them:

```text
Application name: Marginalia & Co.
Short name: Marginalia
Package ID: com.app.marginaliaandco
Start URL: /home
Display mode: fullscreen
Orientation: portrait
Theme color: #1a0905
Background color: #1a0905
Icon URL: https://marginalia-co.vercel.app/icons/play-store-icon-512.png
Maskable icon URL: https://marginalia-co.vercel.app/icons/maskable-512.png
```

## Signing

The wrapper is configured for this upload key path:

```text
E:\2.CurrentProjects\bookshelf\marginalia-twa\marginalia-upload-key.jks
```

and alias:

```text
marginalia
```

Do not create the upload key with an improvised password. Choose a password you can keep safely, then build the signed bundle:

```powershell
cd "E:\2.CurrentProjects\bookshelf\marginalia-twa"
.\scripts\create-upload-key.ps1
.\scripts\build-signed-aab.ps1
```

Expected signed upload artifact:

```text
E:\2.CurrentProjects\bookshelf\marginalia-twa\app-release-bundle.aab
```

The signed build script invokes Gradle directly and does not depend on `npx @bubblewrap/cli`.

## Digital Asset Links

### How to get the SHA-256 fingerprint

For the Play-distributed app, use the **App signing key certificate** SHA-256 from Google Play Console, not the local upload key, once Play App Signing is enabled:

1. Open Play Console for `Marginalia & Co.`.
2. Go to **Test and release > Setup > App signing**. If your Console uses the newer label, this may be under **Test and release > App integrity**.
3. In **App signing key certificate**, copy the **SHA-256 certificate fingerprint**.
4. Keep the package name as `com.app.marginaliaandco` when generating `assetlinks.json`.

Before the app is uploaded to Play, `bubblewrap fingerprint` can show the fingerprint for the local keystore that Bubblewrap built with. That is useful for local wrapper testing, but the production `assetlinks.json` should use the Play App Signing SHA-256 after Play has generated or accepted the final app signing key.

After `bubblewrap fingerprint`, generate the real Digital Asset Links file from the template:

```bash
npm run twa:assetlinks -- --fingerprint AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

The command writes `public/.well-known/assetlinks.json` and refuses empty, malformed, placeholder, or wrong-package inputs. Do not commit an `assetlinks.json` file that still contains `YOUR:SHA256:FINGERPRINT:HERE`.

The file must be reachable at:

```text
https://marginalia-co.vercel.app/.well-known/assetlinks.json
```

After committing, deploying, and waiting for Vercel to go green, verify the production response:

```bash
npm run twa:verify -- --fingerprint AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99 --url https://marginalia-co.vercel.app/.well-known/assetlinks.json
```

The verifier requires a `200` JSON response for package `com.app.marginaliaandco` with the exact supplied fingerprint. A template-only repo state is not Google Play ready.

Without a valid asset links file, Android can show browser chrome instead of a clean app shell.
For the full-screen reading-room feel, keep the web manifest at `display: fullscreen`;
if the generated TWA still shows Android status/navigation bars, enable immersive
mode in the Android wrapper before upload.

## Upload Flow

1. In Play Console, create a new app named `Marginalia & Co.`.
2. Upload the signed `.aab` from Bubblewrap to Internal testing first.
3. Add yourself as a tester and install from the testing link on your Android phone.
4. Verify login, search, pile, reading session, finish flow, shelf/profile, and icon appearance.
5. Promote from internal testing only after the production URL, Supabase save behavior, and privacy policy are confirmed.
6. Share `E:\2.CurrentProjects\bookshelf\marginalia-twa\TESTER_GUIDE.md` with internal testers.

The wrapper project also includes:

- `GOOGLE_PLAY_RELEASE.md` - Play Console upload, listing, access, and data-safety handoff notes.
- `TESTER_GUIDE.md` - tester install instructions, smoke-test checklist, and feedback template.
- `INTERNAL_TESTING_INVITE.md` - copy/paste invitation text for the testing link.

## Still Needed

- Store screenshots from a real phone viewport.
- Final privacy copy/legal review.
- Final data safety answers.
- Signed upload key and signed `.aab`.
- Play App Signing SHA-256 fingerprint.
- Production `assetlinks.json` deploy and verification.

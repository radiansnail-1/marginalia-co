# Affiliate Setup

Marginalia & Co. uses a hybrid affiliate strategy on each book detail page: high-intent buttons first, then lower-priority fallback links. The app builds search URLs from book title, author, and ISBN when available.

## Current Providers

1. Bookshop.org - indie-support positioning and strong bookish brand fit.
2. Shopee - Singapore / Southeast Asia convenience.
3. Lazada - Southeast Asia marketplace fallback.
4. Amazon - convenience fallback for users who already buy there.
5. Kobo - e-book option.
6. Audible - audiobook option.

## Environment Variables

Simple defaults work without env vars. Add provider-specific tracking when accounts are approved.

```bash
# Bookshop.org affiliate ID (numeric, from "Affiliate Profile & Lists").
# When set, per-book links become https://bookshop.org/a/{ID}/{ISBN13}.
# Books without an ISBN13 fall back to https://bookshop.org/a/{ID}/search?keywords=...
NEXT_PUBLIC_BOOKSHOP_AFFILIATE_ID=

# Shopee SG affiliate ID (numeric, from affiliate.shopee.sg).
# When set, search links are wrapped through s.shopee.sg/an_redir
# with affiliate_id and a sub_id of "marginalia" for attribution.
NEXT_PUBLIC_SHOPEE_AFFILIATE_ID=

# Amazon Associates tag.
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=

# Optional: full dashboard-provided link templates that override the above.
# Supported placeholders:
# {query}, {encodedQuery}, {title}, {encodedTitle}, {author}, {encodedAuthor}, {isbn13}
NEXT_PUBLIC_BOOKSHOP_AFFILIATE_TEMPLATE=
NEXT_PUBLIC_SHOPEE_AFFILIATE_TEMPLATE=
NEXT_PUBLIC_LAZADA_AFFILIATE_TEMPLATE=
NEXT_PUBLIC_AMAZON_AFFILIATE_TEMPLATE=
NEXT_PUBLIC_KOBO_AFFILIATE_TEMPLATE=
NEXT_PUBLIC_AUDIBLE_AFFILIATE_TEMPLATE=
```

Example template:

```bash
NEXT_PUBLIC_BOOKSHOP_AFFILIATE_TEMPLATE="https://bookshop.org/search?keywords={encodedQuery}&affiliate=YOUR_ID"
```

## Awin / Audible

Audible UK uses Awin. After creating your Awin publisher account:

1. In Awin, search advertisers/programmes for Audible UK and apply/join.
2. Once approved, go to Toolbox -> Link Builder.
3. Select Audible from the Joined advertiser field.
4. Paste a clean Audible destination URL, for example `https://www.audible.co.uk/search?keywords={encodedQuery}` if the programme permits search deep links, or a specific audiobook/product URL.
5. Click Generate Link and copy the URL version.
6. Put that generated pattern in `NEXT_PUBLIC_AUDIBLE_AFFILIATE_TEMPLATE`.

If Awin gives you a wrapped tracking URL with a destination parameter, keep the Awin tracking pieces exactly as provided and replace only the destination/search text with supported placeholders like `{encodedQuery}`, `{encodedTitle}`, or `{isbn13}`.

Kobo is separate: use Rakuten Advertising, not Awin. Apply to Kobo there, then use Rakuten's link/deep-link tooling and paste the resulting pattern into `NEXT_PUBLIC_KOBO_AFFILIATE_TEMPLATE`.

## Good Operating Model

- Keep three primary buttons on book detail pages: Bookshop, Shopee, Lazada.
- Keep Amazon/Kobo/Audible as secondary chips so the page does not become a shopping wall.
- Prefer search URLs until the app stores reliable ISBNs for most books.
- Use explicit affiliate disclosure near the links.
- Track outbound clicks later with a first-party `/api/affiliate/click` redirect only after the core app is deployed; avoid adding analytics complexity before launch.

## Still Needed

- Apply for and confirm approved affiliate accounts.
- Replace guessed/default URLs with dashboard-provided templates.
- Confirm the legal disclosure text and privacy policy before public launch.
- Add outbound-click analytics once there is traffic worth measuring.

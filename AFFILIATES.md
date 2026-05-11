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
# Shopee simple tracking fallback
NEXT_PUBLIC_SHOPEE_AFFILIATE_ID=

# Amazon Associates
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=

# Full dashboard-provided link templates.
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

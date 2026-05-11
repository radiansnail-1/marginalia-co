// Shopee Singapore affiliate deep-link builder.
// v0.1: search-link only (Shopee doesn't have a clean book-ID lookup in the affiliate API).
// We send users to a Shopee SG search for "<title> <author>", with our affiliate ID appended.
// When the user has an affiliate tracking template, swap the format here.

const SHOPEE_SG_BASE = "https://shopee.sg/search";

export function shopeeSearchUrl(title: string, author: string): string {
  const keyword = `${title} ${author}`.trim();
  const url = new URL(SHOPEE_SG_BASE);
  url.searchParams.set("keyword", keyword);

  const affiliateId = process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID;
  if (affiliateId) {
    // Shopee tracking params (subject to change per affiliate dashboard guidance).
    url.searchParams.set("af_id", affiliateId);
    url.searchParams.set("utm_source", "shopee_affiliate");
    url.searchParams.set("utm_medium", "marginalia");
  }
  return url.toString();
}

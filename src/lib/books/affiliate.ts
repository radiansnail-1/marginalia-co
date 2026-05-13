export type AffiliateBook = {
  title: string;
  author: string;
  isbn13?: string | null;
};

export type AffiliateLink = {
  key: string;
  label: string;
  url: string;
  note: string;
  priority: number;
};

type Provider = {
  key: string;
  label: string;
  note: string;
  priority: number;
  baseUrl: string;
  envTemplate?: string;
  params?: Record<string, string>;
};

const PROVIDERS: Provider[] = [
  {
    key: "bookshop",
    label: "Support indies",
    note: "Bookshop.org",
    priority: 10,
    baseUrl: "https://bookshop.org/search",
    envTemplate: "NEXT_PUBLIC_BOOKSHOP_AFFILIATE_TEMPLATE",
    params: { keywords: "{query}" },
  },
  {
    key: "shopee",
    label: "Find on Shopee",
    note: "Singapore marketplace",
    priority: 20,
    baseUrl: "https://shopee.sg/search",
    envTemplate: "NEXT_PUBLIC_SHOPEE_AFFILIATE_TEMPLATE",
    params: { keyword: "{query}" },
  },
  {
    key: "lazada",
    label: "Find on Lazada",
    note: "Southeast Asia marketplace",
    priority: 30,
    baseUrl: "https://www.lazada.sg/catalog/",
    envTemplate: "NEXT_PUBLIC_LAZADA_AFFILIATE_TEMPLATE",
    params: { q: "{query}" },
  },
  {
    key: "amazon",
    label: "Buy on Amazon",
    note: "Convenient fallback",
    priority: 40,
    baseUrl: "https://www.amazon.com/s",
    envTemplate: "NEXT_PUBLIC_AMAZON_AFFILIATE_TEMPLATE",
    params: { k: "{query}", i: "stripbooks" },
  },
  {
    key: "kobo",
    label: "Read on Kobo",
    note: "E-book option",
    priority: 50,
    baseUrl: "https://www.kobo.com/search",
    envTemplate: "NEXT_PUBLIC_KOBO_AFFILIATE_TEMPLATE",
    params: { query: "{query}" },
  },
  {
    key: "audible",
    label: "Listen on Audible",
    note: "Audiobook option",
    priority: 60,
    baseUrl: "https://www.audible.com/search",
    envTemplate: "NEXT_PUBLIC_AUDIBLE_AFFILIATE_TEMPLATE",
    params: { keywords: "{query}" },
  },
];

export function affiliateLinksForBook(book: AffiliateBook): AffiliateLink[] {
  return PROVIDERS.map((provider) => ({
    key: provider.key,
    label: provider.label,
    note: provider.note,
    priority: provider.priority,
    url: buildProviderUrl(provider, book),
  })).sort((a, b) => a.priority - b.priority);
}

export function shopeeSearchUrl(title: string, author: string): string {
  const provider = PROVIDERS.find((p) => p.key === "shopee");
  if (!provider) throw new Error("Shopee affiliate provider missing");
  return buildProviderUrl(provider, { title, author });
}

function buildProviderUrl(provider: Provider, book: AffiliateBook): string {
  const template = provider.envTemplate ? process.env[provider.envTemplate] : undefined;
  if (template) return fillTemplate(template, book);

  if (provider.key === "bookshop") {
    const affiliateId = process.env.NEXT_PUBLIC_BOOKSHOP_AFFILIATE_ID;
    if (affiliateId) {
      if (book.isbn13) {
        return `https://bookshop.org/a/${affiliateId}/${book.isbn13}`;
      }
      const query = encodeURIComponent(`${book.title} ${book.author}`.trim());
      return `https://bookshop.org/a/${affiliateId}/search?keywords=${query}`;
    }
  }

  if (provider.key === "shopee") {
    const affiliateId = process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID;
    const searchUrl = new URL("https://shopee.sg/search");
    searchUrl.searchParams.set("keyword", `${book.title} ${book.author}`.trim());
    if (affiliateId) {
      const redir = new URL("https://s.shopee.sg/an_redir");
      redir.searchParams.set("origin_link", searchUrl.toString());
      redir.searchParams.set("affiliate_id", affiliateId);
      redir.searchParams.set("sub_id", "marginalia");
      return redir.toString();
    }
    return searchUrl.toString();
  }

  const url = new URL(provider.baseUrl);
  for (const [key, value] of Object.entries(provider.params ?? {})) {
    url.searchParams.set(key, fillTemplate(value, book));
  }

  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
  if (provider.key === "amazon" && tag) url.searchParams.set("tag", tag);

  return url.toString();
}

function fillTemplate(template: string, book: AffiliateBook): string {
  const query = `${book.title} ${book.author}`.trim();
  const values: Record<string, string> = {
    query,
    encodedQuery: encodeURIComponent(query),
    title: book.title,
    encodedTitle: encodeURIComponent(book.title),
    author: book.author,
    encodedAuthor: encodeURIComponent(book.author),
    isbn13: book.isbn13 ?? "",
  };

  return template.replace(/\{(query|encodedQuery|title|encodedTitle|author|encodedAuthor|isbn13)\}/g, (_, key: string) => values[key] ?? "");
}

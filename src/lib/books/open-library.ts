// Open Library cover URL helpers.
// Docs: https://openlibrary.org/dev/docs/api/covers
// Sizes: S, M, L. Append ?default=false to get 404 when missing.

export type CoverSize = "S" | "M" | "L";

export function coverByIsbn(isbn: string | null | undefined, size: CoverSize = "L"): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${size}.jpg?default=false`;
}

export function coverByOlid(olid: string | null | undefined, size: CoverSize = "L"): string | null {
  if (!olid) return null;
  return `https://covers.openlibrary.org/b/olid/${encodeURIComponent(olid)}-${size}.jpg?default=false`;
}

export type OpenLibraryBook = {
  openLibraryId: string;
  title: string;
  author: string;
  isbn13: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  subjects: string[];
  thumbnail: string | null;
  language: string | null;
};

type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  cover_i?: number;
  language?: string[];
};

function pickIsbn(values: string[] | undefined): string | null {
  if (!values?.length) return null;
  return values.find((value) => value.replace(/[^0-9]/g, "").length === 13) ?? values[0] ?? null;
}

function coverByCoverId(coverId: number | null | undefined, size: CoverSize = "M"): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg?default=false`;
}

function openLibraryIdFromKey(key: string | undefined): string | null {
  return key?.replace(/^\/works\//, "") ?? null;
}

export async function searchOpenLibraryBooks(query: string, limit = 12): Promise<OpenLibraryBook[]> {
  if (!query.trim()) return [];
  const url = new URL("https://openlibrary.org/search.json");
  const isbn = query.match(/^isbn:(.+)$/i)?.[1]?.trim();
  if (isbn) url.searchParams.set("isbn", isbn);
  else url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,isbn,subject,cover_i,language");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Marginalia/1.0 (book search)" },
      next: { revalidate: 60 * 60 },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { docs?: OpenLibrarySearchDoc[] };
    return (json.docs ?? []).flatMap((doc) => {
      const openLibraryId = openLibraryIdFromKey(doc.key);
      if (!openLibraryId || !doc.title) return [];
      return [{
        openLibraryId,
        title: doc.title,
        author: doc.author_name?.[0] ?? "Unknown",
        isbn13: pickIsbn(doc.isbn),
        publishedYear: doc.first_publish_year ?? null,
        pageCount: null,
        subjects: doc.subject?.slice(0, 6) ?? [],
        thumbnail: coverByCoverId(doc.cover_i),
        language: doc.language?.[0] ?? null,
      }];
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function hasCover(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

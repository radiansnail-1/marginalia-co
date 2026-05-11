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

export async function hasCover(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

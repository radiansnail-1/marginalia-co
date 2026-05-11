import { z } from "zod";

const VolumeSchema = z.object({
  id: z.string(),
  volumeInfo: z.object({
    title: z.string(),
    authors: z.array(z.string()).optional(),
    publishedDate: z.string().optional(),
    pageCount: z.number().optional(),
    categories: z.array(z.string()).optional(),
    industryIdentifiers: z
      .array(z.object({ type: z.string(), identifier: z.string() }))
      .optional(),
    imageLinks: z
      .object({ thumbnail: z.string().optional(), smallThumbnail: z.string().optional() })
      .optional(),
  }),
});

const EnvelopeSchema = z.object({
  items: z.array(z.unknown()).optional(),
  totalItems: z.number().optional(),
});

export type GoogleBook = {
  googleBooksId: string;
  title: string;
  author: string;
  isbn13: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  subjects: string[];
  thumbnail: string | null;
};

export class GoogleBooksApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `Google Books search failed: ${status}`);
    this.name = "GoogleBooksApiError";
    this.status = status;
  }
}

function pickIsbn(ids: Array<{ type: string; identifier: string }> | undefined): string | null {
  if (!ids) return null;
  return ids.find((i) => i.type === "ISBN_13")?.identifier ?? null;
}

export async function searchBooks(query: string, limit = 12): Promise<GoogleBook[]> {
  if (!query.trim()) return [];
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("printType", "books");
  if (key) url.searchParams.set("key", key);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 60 * 60 }, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new GoogleBooksApiError(408, "Google Books search timed out");
    }
    throw new GoogleBooksApiError(0, (err as Error).message);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) throw new GoogleBooksApiError(res.status);

  const json = EnvelopeSchema.parse(await res.json());
  const rawItems = json.items ?? [];

  const parsed: z.infer<typeof VolumeSchema>[] = [];
  for (const item of rawItems) {
    const r = VolumeSchema.safeParse(item);
    if (r.success) parsed.push(r.data);
  }

  return parsed.map((v) => ({
      googleBooksId: v.id,
      title: v.volumeInfo.title,
      author: v.volumeInfo.authors?.[0] ?? "Unknown",
      isbn13: pickIsbn(v.volumeInfo.industryIdentifiers),
      publishedYear: v.volumeInfo.publishedDate
        ? parseInt(v.volumeInfo.publishedDate.slice(0, 4), 10) || null
        : null,
      pageCount: v.volumeInfo.pageCount ?? null,
      subjects: v.volumeInfo.categories ?? [],
      thumbnail:
        v.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
    }));
}

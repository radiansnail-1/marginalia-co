import "server-only";
import { createHash } from "crypto";

export const EMBEDDING_BASE_URL =
  process.env.EMBEDDING_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "https://api.openai.com/v1";
export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ??
  process.env.OPENAI_EMBEDDING_MODEL ??
  "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS ??
  process.env.OPENAI_EMBEDDING_DIMENSIONS ??
  256,
);
export const EMBEDDING_MAX_RUNTIME_TEXTS = Number(process.env.EMBEDDING_MAX_RUNTIME_TEXTS ?? 6);

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

export type EmbeddableBook = {
  title: string;
  author: string;
  description?: string | null;
  embeddingSummary?: string | null;
  subjects?: string[] | null;
  publishedYear?: number | null;
  pageCount?: number | null;
};

export function bookEmbeddingText(book: EmbeddableBook): string {
  return [
    `Title: ${book.title}`,
    `Author: ${book.author}`,
    book.publishedYear ? `Published: ${book.publishedYear}` : "",
    book.pageCount ? `Length: ${book.pageCount} pages` : "",
    book.subjects?.length ? `Subjects: ${book.subjects.slice(0, 8).join(", ")}` : "",
    book.embeddingSummary ? `Semantic summary: ${book.embeddingSummary.slice(0, 1200)}` : "",
    book.description ? `Description: ${book.description.slice(0, 700)}` : "",
  ].filter(Boolean).join("\n");
}

export function embeddingTextHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    aMag += a[i] * a[i];
    bMag += b[i] * b[i];
  }
  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

export async function embedTexts(input: string[]): Promise<number[][] | null> {
  const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY;
  const texts = input.map((t) => t.trim()).filter(Boolean).slice(0, Math.max(0, EMBEDDING_MAX_RUNTIME_TEXTS));
  if (!apiKey || texts.length === 0) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${EMBEDDING_BASE_URL.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
        encoding_format: "float",
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as EmbeddingResponse;
    const vectors = json.data?.map((item) => item.embedding).filter((v): v is number[] => Array.isArray(v));
    return vectors?.length === texts.length ? vectors : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY;
const baseUrl = (process.env.EMBEDDING_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.EMBEDDING_MODEL ?? process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 256);
const limit = Number(args.get("limit") ?? 1000);
const batchSize = Math.max(1, Math.min(128, Number(args.get("batch") ?? 10)));
const dryRun = args.has("dry-run");
const pageSize = 1000;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!apiKey && !dryRun) {
  console.error("Set EMBEDDING_API_KEY, or OPENAI_API_KEY for the legacy OpenAI path.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function bookEmbeddingText(book) {
  return [
    `Title: ${book.title}`,
    `Author: ${book.author}`,
    book.published_year ? `Published: ${book.published_year}` : "",
    book.page_count ? `Length: ${book.page_count} pages` : "",
    book.subjects?.length ? `Subjects: ${book.subjects.slice(0, 8).join(", ")}` : "",
    book.embedding_summary ? `Semantic summary: ${book.embedding_summary.slice(0, 1200)}` : "",
    book.description ? `Description: ${book.description.slice(0, 700)}` : "",
  ].filter(Boolean).join("\n");
}

function embeddingTextHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function embedTexts(texts) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: texts,
        dimensions,
        encoding_format: "float",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const retryAfter = Number(res.headers.get("retry-after"));
      const retryMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(15000, 1000 * 2 ** (attempt - 1));
      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        console.warn(`Embedding request failed: ${res.status}; retrying in ${retryMs}ms (${attempt}/${maxAttempts}).`);
        await new Promise((resolve) => setTimeout(resolve, retryMs));
        continue;
      }
      throw new Error(`Embedding request failed: ${res.status} ${body}`);
    }
    const json = await res.json();
    const vectors = json.data?.map((item) => item.embedding).filter(Array.isArray);
    if (!vectors || vectors.length !== texts.length) {
      throw new Error(`Embedding response returned ${vectors?.length ?? 0} vectors for ${texts.length} texts.`);
    }
    return vectors;
  }
  throw new Error("Embedding request failed after retries.");
}

async function fetchBooks() {
  const rows = [];
  for (let from = 0; from < limit; from += pageSize) {
    const to = Math.min(from + pageSize, limit) - 1;
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, description, embedding_summary, subjects, page_count, published_year, embedding, embedding_model, embedding_dimensions, embedding_text_hash")
      .order("added_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < to - from + 1) break;
  }
  return rows;
}

let books;
try {
  books = await fetchBooks();
} catch (error) {
  if (error.code === "42703") {
    console.error("The books embedding columns are missing. Apply supabase/migrations/0010_book_embeddings.sql before pre-embedding.");
    process.exit(1);
  }
  console.error(error.message);
  process.exit(1);
}

const stale = books.flatMap((book) => {
  const text = bookEmbeddingText(book);
  const hash = embeddingTextHash(text);
  const cached =
    Array.isArray(book.embedding) &&
    book.embedding_model === model &&
    book.embedding_dimensions === dimensions &&
    book.embedding_text_hash === hash;
  return cached ? [] : [{ ...book, text, hash }];
});

console.log(`Found ${stale.length} books needing ${dryRun ? "dry-run " : ""}embeddings out of ${books.length} scanned.`);
if (!dryRun && stale.length > 0) {
  let embedded = 0;
  for (let i = 0; i < stale.length; i += batchSize) {
    const batch = stale.slice(i, i + batchSize);
    const vectors = await embedTexts(batch.map((book) => book.text));
    await Promise.all(batch.map((book, idx) =>
      supabase
        .from("books")
        .update({
          embedding: vectors[idx],
          embedding_model: model,
          embedding_dimensions: dimensions,
          embedding_text_hash: book.hash,
          embedded_at: new Date().toISOString(),
        })
        .eq("id", book.id),
    ));
    embedded += batch.length;
    console.log(`Embedded ${embedded}/${stale.length}`);
  }

  console.log(`Done. Embedded ${embedded} books with ${model} (${dimensions} dimensions).`);
}

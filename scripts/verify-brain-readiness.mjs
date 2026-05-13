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
const model = process.env.EMBEDDING_MODEL ?? process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 256);
const limit = Number(args.get("limit") ?? 10000);
const json = args.has("json");
const pageSize = 1000;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function embeddingText(book) {
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

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function countRows(table, query = (q) => q) {
  const { count, error } = await query(
    supabase.from(table).select("id", { count: "exact", head: true }),
  );
  if (error) return { ok: false, error: error.message, count: 0 };
  return { ok: true, count: count ?? 0 };
}

async function tableAvailable(table) {
  const { error } = await supabase.from(table).select("*").limit(1);
  return { ok: !error, error: error?.message ?? null };
}

async function fetchBooks() {
  const rows = [];
  for (let from = 0; from < limit; from += pageSize) {
    const to = Math.min(from + pageSize, limit) - 1;
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, description, embedding_summary, cover_url, subjects, page_count, published_year, embedding, embedding_model, embedding_dimensions, embedding_text_hash")
      .order("added_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < to - from + 1) break;
  }
  return rows;
}

let rows;
try {
  rows = await fetchBooks();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

let embeddedCurrent = 0;
let embeddedStale = 0;
let embeddedAny = 0;
let missingDescriptions = 0;
let missingEmbeddingSummaries = 0;
let missingCovers = 0;

for (const book of rows) {
  if (!book.description) missingDescriptions++;
  if (!book.embedding_summary) missingEmbeddingSummaries++;
  if (!book.cover_url) missingCovers++;
  if (Array.isArray(book.embedding)) {
    embeddedAny++;
    const expectedHash = hashText(embeddingText(book));
    const current =
      book.embedding_model === model &&
      book.embedding_dimensions === dimensions &&
      book.embedding_text_hash === expectedHash;
    if (current) embeddedCurrent++;
    else embeddedStale++;
  }
}

const recommendationEvents = await tableAvailable("recommendation_events");
const tasteProfiles = await tableAvailable("user_taste_profiles");
const userBooks = await countRows("user_books");
const report = {
  scannedBooks: rows.length,
  model,
  dimensions,
  embeddedAny,
  embeddedCurrent,
  embeddedStale,
  missingDescriptions,
  missingEmbeddingSummaries,
  missingCovers,
  userBooks: userBooks.count,
  recommendationEventsAvailable: recommendationEvents.ok,
  recommendationEventsError: recommendationEvents.error,
  tasteProfilesAvailable: tasteProfiles.ok,
  tasteProfilesError: tasteProfiles.error,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Scanned books: ${report.scannedBooks}`);
  console.log(`Embeddings current: ${report.embeddedCurrent}`);
  console.log(`Embeddings stale: ${report.embeddedStale}`);
  console.log(`Embeddings present: ${report.embeddedAny}`);
  console.log(`Missing descriptions: ${report.missingDescriptions}`);
  console.log(`Missing embedding summaries: ${report.missingEmbeddingSummaries}`);
  console.log(`Missing covers: ${report.missingCovers}`);
  console.log(`User shelf rows: ${report.userBooks}`);
  console.log(`recommendation_events table: ${report.recommendationEventsAvailable ? "ok" : `missing (${report.recommendationEventsError})`}`);
  console.log(`user_taste_profiles table: ${report.tasteProfilesAvailable ? "ok" : `missing (${report.tasteProfilesError})`}`);
}

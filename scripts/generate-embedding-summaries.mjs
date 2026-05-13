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
const apiKey = process.env.SUMMARY_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.EMBEDDING_API_KEY;
const baseUrl = (
  process.env.SUMMARY_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  process.env.EMBEDDING_BASE_URL ??
  "https://api.openai.com/v1"
).replace(/\/$/, "");
const model = process.env.SUMMARY_MODEL ?? process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini";
const limit = Number(args.get("limit") ?? 100);
const pageSize = Math.max(1, Math.min(1000, Number(args.get("page-size") ?? 1000)));
const concurrency = Math.max(1, Math.min(8, Number(args.get("concurrency") ?? 3)));
const progressEvery = Math.max(0, Number(args.get("progress-every") ?? 100));
const shards = Math.max(1, Number(args.get("shards") ?? 1));
const shard = Math.max(0, Number(args.get("shard") ?? 0));
const dryRun = args.has("dry-run");
const force = args.has("force");
const missingDescriptionOnly = args.has("missing-description-only");
const startedAt = Date.now();

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!apiKey && !dryRun) {
  console.error("Set SUMMARY_API_KEY, OPENAI_API_KEY, or EMBEDDING_API_KEY, or pass --dry-run.");
  process.exit(1);
}
if (!Number.isInteger(shards) || !Number.isInteger(shard) || shard >= shards) {
  console.error("Set --shards to a positive integer and --shard to an integer from 0 to shards - 1.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function shardForId(id) {
  let hash = 0;
  for (const char of String(id)) {
    hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
  }
  return hash % shards;
}

function belongsToShard(book) {
  return shards === 1 || shardForId(book.id) === shard;
}

function cleanSummary(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1600);
}

function confidence(value) {
  const normalized = String(value ?? "").toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function parseJson(content) {
  const raw = String(content ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object in model response.");
  return JSON.parse(raw.slice(start, end + 1));
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function progressLine() {
  const percent = limit > 0 ? Math.min(100, Math.round((processed / limit) * 100)) : 0;
  const filled = Math.round(percent / 5);
  const bar = `${"#".repeat(filled)}${"-".repeat(20 - filled)}`;
  const elapsed = formatDuration(Date.now() - startedAt);
  const shardLabel = shards > 1 ? ` shard=${shard}/${shards}` : "";
  return `[progress${shardLabel}] [${bar}] ${processed}/${limit} ${percent}% scanned=${scanned} summarized=${summarized} updated=${updated} skipped=${skipped} errors=${errors} elapsed=${elapsed}`;
}

async function summarizeBook(book) {
  const messages = [
    {
      role: "system",
      content: [
        "You write internal semantic summaries for a book recommendation embedding system.",
        "The summary is not public UI copy. Optimize for retrieval quality: genre, setting, period, themes, tone, subject matter, narrative shape, and reader appeal.",
        "Do not invent precise facts if you are unsure. If the book is obscure or metadata is thin, write a lower-confidence summary from the known metadata.",
        "Return only JSON with keys summary and confidence. Confidence must be high, medium, or low.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Title: ${book.title}`,
        `Author: ${book.author}`,
        book.published_year ? `Published year: ${book.published_year}` : "",
        book.page_count ? `Page count: ${book.page_count}` : "",
        book.subjects?.length ? `Subjects: ${book.subjects.slice(0, 12).join(", ")}` : "",
        book.description ? `Existing public description: ${book.description}` : "",
        "",
        "Write one dense 70-130 word semantic summary for embeddings.",
      ].filter(Boolean).join("\n"),
    },
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Summary request failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const parsed = parseJson(json.choices?.[0]?.message?.content);
  const summary = cleanSummary(parsed.summary);
  if (summary.length < 40) throw new Error("Model returned an unusably short summary.");
  return { summary, confidence: confidence(parsed.confidence) };
}

let scanned = 0;
let processed = 0;
let summarized = 0;
let updated = 0;
let skipped = 0;
let errors = 0;

async function worker(items) {
  for (const book of items) {
    try {
      if (dryRun) {
        summarized++;
        console.log(`[dry-run] ${book.title} - ${book.author}`);
        continue;
      }
      const result = await summarizeBook(book);
      summarized++;
      const { error } = await supabase
        .from("books")
        .update({
          embedding_summary: result.summary,
          embedding_summary_confidence: result.confidence,
          embedding_summary_model: model,
          embedding_summary_updated_at: new Date().toISOString(),
          embedding: null,
          embedding_model: null,
          embedding_dimensions: null,
          embedding_text_hash: null,
          embedded_at: null,
        })
        .eq("id", book.id);
      if (error) throw error;
      updated++;
      console.log(`[summary:${result.confidence}] ${book.title} - ${book.author}`);
    } catch (error) {
      errors++;
      console.log(`[error] ${book.title} - ${book.author}: ${error.message}`);
    } finally {
      processed++;
      if (progressEvery > 0 && processed % progressEvery === 0) {
        console.log(progressLine());
      }
    }
  }
}

let cursor = null;

while (scanned < limit) {
  const batchLimit = Math.min(pageSize, limit - scanned);
  let query = supabase
    .from("books")
    .select("id, title, author, description, embedding_summary, subjects, page_count, published_year, added_at")
    .order("added_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(batchLimit);

  if (!force) query = query.is("embedding_summary", null);
  if (missingDescriptionOnly) query = query.is("description", null);
  if (cursor) {
    query = query.or(`added_at.lt.${cursor.added_at},and(added_at.eq.${cursor.added_at},id.lt.${cursor.id})`);
  }

  const { data: books, error } = await query;
  if (error) {
    if (error.code === "42703") {
      console.error("The books embedding_summary columns are missing. Apply supabase/migrations/0014_book_embedding_summaries.sql first.");
      process.exit(1);
    }
    console.error(error.message);
    process.exit(1);
  }
  if (!books?.length) break;

  scanned += books.length;
  cursor = books.at(-1);
  const shardBooks = books.filter(belongsToShard);
  skipped += books.length - shardBooks.length;
  const shardLabel = shards > 1 ? ` shard ${shard}/${shards} kept ${shardBooks.length}` : "";
  console.log(`Page: scanned ${books.length} books after ${scanned - books.length} already scanned.${shardLabel}`);

  const queues = Array.from({ length: concurrency }, () => []);
  shardBooks.forEach((book, index) => queues[index % concurrency].push(book));
  await Promise.all(queues.map(worker));
}

console.log(`Done. scanned=${scanned} summarized=${summarized} updated=${updated} skipped=${skipped} errors=${errors} dryRun=${dryRun} model=${model} shard=${shard}/${shards}`);

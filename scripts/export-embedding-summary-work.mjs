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
const limit = Number(args.get("limit") ?? 50);
const pageSize = Math.max(1, Math.min(1000, Number(args.get("page-size") ?? 1000)));
const shards = Math.max(1, Number(args.get("shards") ?? 1));
const shard = Math.max(0, Number(args.get("shard") ?? 0));
const missingDescriptionOnly = args.has("missing-description-only");

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
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

let cursor = null;
let emitted = 0;

while (emitted < limit) {
  let query = supabase
    .from("books")
    .select("id, title, author, description, subjects, page_count, published_year, average_rating, rating_count, added_at")
    .is("embedding_summary", null)
    .order("added_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize);

  if (missingDescriptionOnly) query = query.is("description", null);
  if (cursor) {
    query = query.or(`added_at.lt.${cursor.added_at},and(added_at.eq.${cursor.added_at},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) {
    if (error.code === "42703") {
      console.error("The books embedding_summary columns are missing. Apply supabase/migrations/0014_book_embedding_summaries.sql first.");
      process.exit(1);
    }
    console.error(error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  cursor = data.at(-1);

  for (const book of data) {
    if (shardForId(book.id) !== shard) continue;
    console.log(JSON.stringify({
      id: book.id,
      title: book.title,
      author: book.author,
      publishedYear: book.published_year,
      pageCount: book.page_count,
      subjects: book.subjects ?? [],
      averageRating: book.average_rating,
      ratingCount: book.rating_count,
    }));
    emitted++;
    if (emitted >= limit) break;
  }
}

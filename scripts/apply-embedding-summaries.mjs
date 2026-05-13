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
const file = args.get("file");
const model = args.get("model") ?? "codex-agent";
const dryRun = args.has("dry-run");

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!file) {
  console.error("Pass --file=<jsonl>.");
  process.exit(1);
}

function cleanSummary(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1600);
}

function cleanConfidence(value) {
  const normalized = String(value ?? "").toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

const updates = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .map((row) => ({
    id: row.id,
    summary: cleanSummary(row.summary),
    confidence: cleanConfidence(row.confidence),
  }))
  .filter((row) => row.id && row.summary.length >= 40);

console.log(`Loaded ${updates.length} summary updates from ${file}.`);
if (dryRun) process.exit(0);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let applied = 0;
for (const row of updates) {
  const { error } = await supabase
    .from("books")
    .update({
      embedding_summary: row.summary,
      embedding_summary_confidence: row.confidence,
      embedding_summary_model: model,
      embedding_summary_updated_at: new Date().toISOString(),
      embedding: null,
      embedding_model: null,
      embedding_dimensions: null,
      embedding_text_hash: null,
      embedded_at: null,
    })
    .eq("id", row.id);
  if (error) throw error;
  applied++;
}

console.log(`Done. applied=${applied} model=${model}`);

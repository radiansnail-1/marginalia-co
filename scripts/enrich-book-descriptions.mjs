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

const limit = Number(args.get("limit") ?? 100);
const concurrency = Math.max(1, Math.min(6, Number(args.get("concurrency") ?? 3)));
const dryRun = args.has("dry-run");
const force = args.has("force");
const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
const userAgent = process.env.BOOK_METADATA_USER_AGENT ?? "Marginalia/1.0 (book metadata enrichment)";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCore(value) {
  return normalize(value)
    .replace(/\s+book\s+\d+$/u, "")
    .replace(/\s+\d+$/u, "")
    .trim();
}

function cleanDescription(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1400);
}

function authorMatches(expected, candidate) {
  const a = normalize(expected);
  const b = normalize(candidate);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const last = a.split(" ").at(-1);
  return !!last && b.split(" ").includes(last);
}

function titleMatches(expected, candidate) {
  const a = titleCore(expected);
  const b = titleCore(candidate);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function pickIsbn(ids) {
  return ids?.find((i) => i.type === "ISBN_13")?.identifier ?? ids?.find((i) => i.type === "ISBN_10")?.identifier ?? null;
}

function confidence(book, candidate) {
  let score = 0;
  if (book.google_books_id && candidate.google_books_id === book.google_books_id) score += 100;
  if (book.isbn_13 && candidate.isbn13 && book.isbn_13 === candidate.isbn13) score += 90;
  if (titleCore(book.title) === titleCore(candidate.title)) score += 45;
  else if (titleMatches(book.title, candidate.title)) score += 25;
  if (authorMatches(book.author, candidate.author)) score += 35;
  if (book.published_year && candidate.publishedYear && Math.abs(book.published_year - candidate.publishedYear) <= 1) score += 10;
  if (book.page_count && candidate.pageCount) {
    const delta = Math.abs(book.page_count - candidate.pageCount) / Math.max(book.page_count, candidate.pageCount);
    if (delta <= 0.15) score += 8;
  }
  if (candidate.description) score += 5;
  return score;
}

async function googleByVolumeId(book) {
  if (!book.google_books_id) return null;
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(book.google_books_id)}`);
  url.searchParams.set("fields", "id,volumeInfo(title,authors,publishedDate,description,industryIdentifiers,pageCount,categories,imageLinks)");
  if (googleKey) url.searchParams.set("key", googleKey);
  const res = await fetch(url);
  if (!res.ok) return null;
  const item = await res.json();
  const info = item.volumeInfo ?? {};
  const description = cleanDescription(info.description);
  if (description.length < 80) return null;
  return {
    source: "google",
    description,
    google_books_id: item.id ?? book.google_books_id,
    isbn_13: book.isbn_13 ?? pickIsbn(info.industryIdentifiers),
    cover_url: book.cover_url ?? info.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
    page_count: book.page_count ?? info.pageCount ?? null,
    published_year: book.published_year ?? (info.publishedDate ? parseInt(String(info.publishedDate).slice(0, 4), 10) || null : null),
    subjects: info.categories?.length ? [...new Set([...(book.subjects ?? []), ...info.categories])] : book.subjects,
  };
}

async function googleSearch(book) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", book.isbn_13 ? `isbn:${book.isbn_13}` : `intitle:${book.title} inauthor:${book.author}`);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("printType", "books");
  url.searchParams.set("fields", "items(id,volumeInfo(title,authors,publishedDate,description,industryIdentifiers,pageCount,categories,imageLinks)),totalItems");
  if (googleKey) url.searchParams.set("key", googleKey);

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  let best = null;
  for (const item of json.items ?? []) {
    const info = item.volumeInfo ?? {};
    const author = Array.isArray(info.authors) ? info.authors.join(" ") : "";
    const description = cleanDescription(info.description);
    if (description.length < 80) continue;
    const candidate = {
      google_books_id: item.id ?? null,
      isbn13: pickIsbn(info.industryIdentifiers),
      title: info.title ?? "",
      author,
      pageCount: info.pageCount ?? null,
      publishedYear: info.publishedDate ? parseInt(String(info.publishedDate).slice(0, 4), 10) || null : null,
      description,
      score: 0,
      payload: null,
    };
    candidate.score = confidence(book, candidate);
    candidate.payload = {
      source: "google",
      description,
      google_books_id: item.id ?? book.google_books_id ?? null,
      isbn_13: book.isbn_13 ?? candidate.isbn13,
      cover_url: book.cover_url ?? info.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
      page_count: book.page_count ?? info.pageCount ?? null,
      published_year: book.published_year ?? candidate.publishedYear,
      subjects: info.categories?.length ? [...new Set([...(book.subjects ?? []), ...info.categories])] : book.subjects,
    };
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best && best.score >= 75 ? best.payload : null;
}

async function openLibrarySearch(book) {
  const search = new URL("https://openlibrary.org/search.json");
  search.searchParams.set("title", book.title);
  search.searchParams.set("author", book.author);
  search.searchParams.set("limit", "5");
  search.searchParams.set("fields", "key,title,author_name,first_publish_year,subject");

  const res = await fetch(search, { headers: { "User-Agent": userAgent } });
  if (!res.ok) return null;
  const json = await res.json();
  for (const doc of json.docs ?? []) {
    const author = Array.isArray(doc.author_name) ? doc.author_name.join(" ") : "";
    if (!titleMatches(book.title, doc.title) || !authorMatches(book.author, author) || !doc.key) continue;
    const workRes = await fetch(`https://openlibrary.org${doc.key}.json`, { headers: { "User-Agent": userAgent } });
    if (!workRes.ok) continue;
    const work = await workRes.json();
    const raw = typeof work.description === "string" ? work.description : work.description?.value;
    const description = cleanDescription(raw);
    if (description.length < 80) continue;
    return {
      source: "openlibrary",
      description,
      published_year: book.published_year ?? doc.first_publish_year ?? null,
      subjects: doc.subject?.length ? [...new Set([...(book.subjects ?? []), ...doc.subject.slice(0, 8)])] : book.subjects,
    };
  }
  return null;
}

async function enrich(book) {
  return (await googleByVolumeId(book)) ?? (await googleSearch(book)) ?? (await openLibrarySearch(book));
}

let query = supabase
  .from("books")
  .select("id, title, author, description, google_books_id, isbn_13, cover_url, page_count, published_year, subjects")
  .order("added_at", { ascending: false })
  .limit(limit);

if (!force) query = query.is("description", null);

const { data: books, error } = await query;
if (error) {
  console.error(error.message);
  process.exit(1);
}

let checked = 0;
let found = 0;
let updated = 0;
let missed = 0;

async function worker(items) {
  for (const book of items) {
    checked++;
    try {
      const result = await enrich(book);
      if (!result) {
        missed++;
        console.log(`[miss] ${book.title} - ${book.author}`);
        continue;
      }
      found++;
      console.log(`[found:${result.source}] ${book.title} - ${book.author}`);
      if (dryRun) continue;
      const payload = {
        description: result.description,
        google_books_id: result.google_books_id ?? book.google_books_id,
        isbn_13: result.isbn_13 ?? book.isbn_13,
        cover_url: result.cover_url ?? book.cover_url,
        page_count: result.page_count ?? book.page_count,
        published_year: result.published_year ?? book.published_year,
        subjects: result.subjects ?? book.subjects ?? [],
        embedding: null,
        embedding_model: null,
        embedding_dimensions: null,
        embedding_text_hash: null,
        embedded_at: null,
      };
      const { error: updateError } = await supabase.from("books").update(payload).eq("id", book.id);
      if (updateError) throw updateError;
      updated++;
    } catch (err) {
      missed++;
      console.log(`[error] ${book.title} - ${book.author}: ${err.message}`);
    }
  }
}

const queues = Array.from({ length: concurrency }, () => []);
(books ?? []).forEach((book, index) => queues[index % concurrency].push(book));
await Promise.all(queues.map(worker));

console.log(`Done. checked=${checked} found=${found} updated=${updated} missed=${missed} dryRun=${dryRun} concurrency=${concurrency}`);

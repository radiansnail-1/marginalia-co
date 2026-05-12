import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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

const zipPath = args.get("zip") ?? process.env.GOODREADS_ARCHIVE_ZIP ?? "C:\\Users\\aweso\\Downloads\\archive.zip";
const csvPath = args.get("csv") ?? process.env.GOODREADS_CSV;
const zipEntry = args.get("entry") ?? "goodreads_cleaned.csv";
const limit = Number(args.get("limit") ?? 10000);
const listOnly = args.has("list-only");
const dryRun = args.has("dry-run") || listOnly;
const apiToken = args.get("api-token") ?? process.env.MARGINALIA_API_TOKEN;
const apiUrl = args.get("api-url") ?? process.env.MARGINALIA_API_URL ?? "https://marginalia-co.vercel.app/api/v1/books";
const apiStatus = args.get("status") ?? process.env.MARGINALIA_API_STATUS ?? "finished";

function readZipEntry(path, entry) {
  const psQuote = (value) => `'${String(value).replace(/'/g, "''")}'`;
  const command = `
$zipPath = ${psQuote(path)}
$entryName = ${psQuote(entry)}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entry = $zip.GetEntry($entryName)
  if ($null -eq $entry) { throw "Entry not found: $entryName" }
  $reader = [System.IO.StreamReader]::new($entry.Open())
  try { $reader.ReadToEnd() } finally { $reader.Dispose() }
} finally {
  $zip.Dispose()
}
`;
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Could not read ${entry} from ${path}`);
  }
  return result.stdout;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift()?.map((h) => h.trim()) ?? [];
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ""])));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function cleanTitle(title) {
  return title
    .replace(/\s+\([^)]*#\d+[^)]*\)\s*$/u, "")
    .replace(/\s+\([^)]*,\s*#\d+[^)]*\)\s*$/u, "")
    .trim();
}

function parseCount(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function goodreadsDescription(book) {
  const rating = book.goodreadsRating ? `${book.goodreadsRating.toFixed(2)} average Goodreads rating` : "a strong Goodreads rating";
  const count = book.goodreadsRatingsCount ? ` from ${book.goodreadsRatingsCount.toLocaleString("en-US")} readers` : "";
  return `${book.title} is a widely read Goodreads-listed book by ${book.author}, with ${rating}${count}.`;
}

function dedupeBooks(input) {
  const seen = new Set();
  const out = [];
  for (const book of input) {
    const key = `${normalize(book.title)}|${normalize(book.author)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(book);
  }
  return out;
}

function apiUrlWithStatus() {
  const url = new URL(apiUrl);
  if (apiStatus && !url.searchParams.has("status")) url.searchParams.set("status", apiStatus);
  return url;
}

async function loadApiShelf() {
  if (!apiToken) return [];
  const res = await fetch(apiUrlWithStatus(), {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) throw new Error(`Shelf API returned ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.books ?? []).flatMap((book) => {
    if (!book.title || !book.author) return [];
    return [{
      title: book.title,
      author: book.author,
      publishedYear: book.published_year ?? null,
      subjects: book.subjects?.length ? book.subjects : ["personal shelf"],
      pageCount: book.page_count ?? null,
      description: book.description ?? `${book.title} is already on the reader's ${book.status ?? "finished"} shelf.`,
      isbn13: book.isbn13 ?? null,
      googleBooksId: book.google_books_id ?? null,
      coverUrl: book.cover_url ?? null,
    }];
  });
}

const csvText = csvPath ? readFileSync(csvPath, "utf8") : readZipEntry(zipPath, zipEntry);
const goodreadsBooks = parseCsv(csvText).flatMap((row) => {
  const title = cleanTitle(row.bookTitle ?? row.title ?? "");
  const author = (row.authorName ?? row.author ?? "").trim();
  if (!title || !author) return [];
  const goodreadsRating = Number(row.average_rating ?? row.rating);
  const goodreadsRatingsCount = parseCount(row.num_ratings ?? row.ratings_count);
  return [{
    title,
    author,
    subjects: ["goodreads top books", "popular books"],
    goodreadsRating: Number.isFinite(goodreadsRating) ? goodreadsRating : null,
    goodreadsRatingsCount,
  }];
});

const shelfBooks = await loadApiShelf();
const books = dedupeBooks([...shelfBooks, ...goodreadsBooks])
  .slice(0, limit)
  .map((book) => ({ ...book, description: book.description ?? goodreadsDescription(book) }));

if (listOnly) {
  for (const book of books.slice(0, Math.min(50, books.length))) {
    console.log(`${book.title} - ${book.author} :: ${book.description}`);
  }
  console.log(`Listed ${books.length} books (${shelfBooks.length} from API shelf, ${goodreadsBooks.length} Goodreads rows).`);
} else {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error } = await supabase
    .from("books")
    .select("id, title, author, description");
  if (error) {
    if (error.code === "42703") {
      console.error("The books description column is missing. Apply supabase/migrations/0012_book_descriptions.sql before seeding Goodreads blurbs.");
      process.exit(1);
    }
    console.error(error.message);
    process.exit(1);
  }

  const existingByKey = new Map((existing ?? []).map((book) => [`${normalize(book.title)}|${normalize(book.author)}`, book]));
  const rows = books.flatMap((book) => {
    if (existingByKey.has(`${normalize(book.title)}|${normalize(book.author)}`)) return [];
    return [{
      title: book.title,
      author: book.author,
      google_books_id: book.googleBooksId ?? null,
      isbn_13: book.isbn13 ?? null,
      published_year: book.publishedYear ?? null,
      page_count: book.pageCount ?? null,
      cover_url: book.coverUrl ?? null,
      description: book.description,
      subjects: book.subjects ?? ["goodreads top books"],
    }];
  });
  const descriptionUpdates = books.flatMap((book) => {
    const existingBook = existingByKey.get(`${normalize(book.title)}|${normalize(book.author)}`);
    if (!existingBook || existingBook.description) return [];
    return [{ id: existingBook.id, description: book.description }];
  });

  console.log(`${rows.length} of ${books.length} seed books are new to the catalog (${shelfBooks.length} loaded from API shelf).`);
  console.log(`${descriptionUpdates.length} existing books can receive missing descriptions.`);
  if (!dryRun && rows.length > 0) {
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from("books").insert(batch);
      if (insertError) {
        console.error(insertError.message);
        process.exit(1);
      }
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${rows.length}`);
    }
    console.log(`Done. Seeded ${inserted} Goodreads books without calling Google Books or OpenAI.`);
  }
  if (!dryRun && descriptionUpdates.length > 0) {
    let updated = 0;
    for (const patch of descriptionUpdates) {
      const { error: updateError } = await supabase
        .from("books")
        .update({ description: patch.description })
        .eq("id", patch.id);
      if (updateError) {
        console.error(updateError.message);
        process.exit(1);
      }
      updated++;
    }
    console.log(`Updated ${updated} existing book descriptions.`);
  }
}

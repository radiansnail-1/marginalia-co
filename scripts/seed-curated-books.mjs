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

const curated = JSON.parse(readFileSync("data/curated-books.json", "utf8"));
const limit = Number(args.get("limit") ?? curated.length);
const listOnly = args.has("list-only");
const dryRun = args.has("dry-run") || listOnly;
const apiToken = args.get("api-token") ?? process.env.MARGINALIA_API_TOKEN;
const apiUrl = args.get("api-url") ?? process.env.MARGINALIA_API_URL ?? "https://marginalia-co.vercel.app/api/v1/books";
const apiStatus = args.get("status") ?? process.env.MARGINALIA_API_STATUS;

function articleFor(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function humanList(items) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function fallbackBlurb(book) {
  if (book.description) return book.description;
  const subjects = (book.subjects ?? []).slice(0, 4);
  const primary = subjects[0] ?? "literary";
  const rest = subjects.slice(1, 4);
  const year = book.publishedYear ? ` from ${book.publishedYear}` : "";
  const tail = rest.length ? `, touching on ${humanList(rest)}` : "";
  return `${book.title} is ${articleFor(primary)} ${primary} work${year} by ${book.author}${tail}.`;
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
  if (!res.ok) {
    throw new Error(`Shelf API returned ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return (json.books ?? []).flatMap((book) => {
    if (!book.title || !book.author) return [];
    return [{
      title: book.title,
      author: book.author,
      publishedYear: book.published_year ?? null,
      subjects: book.subjects ?? [],
      pageCount: book.page_count ?? null,
      description: book.description ?? null,
      isbn13: book.isbn13 ?? null,
      googleBooksId: book.google_books_id ?? null,
      coverUrl: book.cover_url ?? null,
    }];
  });
}

function normalize(value) {
  return value.trim().toLowerCase();
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

const shelfBooks = await loadApiShelf();
const books = dedupeBooks([...shelfBooks, ...curated]).slice(0, limit);

if (listOnly) {
  for (const book of books) {
    console.log(`${book.title} - ${book.author} [${book.subjects.join(", ")}]`);
  }
  console.log(`Listed ${books.length} books (${shelfBooks.length} from API shelf, ${curated.length} curated).`);
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
      console.error("The books description column is missing. Apply supabase/migrations/0012_book_descriptions.sql before seeding blurbs.");
      process.exit(1);
    }
    console.error(error.message);
    process.exit(1);
  }

  const existingKeys = new Set((existing ?? []).map((book) => `${normalize(book.title)}|${normalize(book.author)}`));
  const existingByKey = new Map((existing ?? []).map((book) => [`${normalize(book.title)}|${normalize(book.author)}`, book]));
  const rows = books
    .filter((book) => !existingKeys.has(`${normalize(book.title)}|${normalize(book.author)}`))
    .map((book) => ({
      title: book.title,
      author: book.author,
      google_books_id: book.googleBooksId ?? null,
      isbn_13: book.isbn13 ?? null,
      published_year: book.publishedYear ?? null,
      page_count: book.pageCount ?? null,
      cover_url: book.coverUrl ?? null,
      description: fallbackBlurb(book),
      subjects: book.subjects ?? [],
    }));
  const descriptionUpdates = books
    .flatMap((book) => {
      const description = fallbackBlurb(book);
      if (!description) return [];
      const existingBook = existingByKey.get(`${normalize(book.title)}|${normalize(book.author)}`);
      if (!existingBook || existingBook.description) return [];
      return [{ id: existingBook.id, description }];
    });

  console.log(`${rows.length} of ${books.length} seed books are new to the catalog (${shelfBooks.length} loaded from API shelf).`);
  console.log(`${descriptionUpdates.length} existing books can receive missing descriptions.`);
  if (!dryRun && rows.length > 0) {
    const batchSize = 100;
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

    console.log(`Done. Seeded ${inserted} curated books without calling Google Books or OpenAI.`);
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

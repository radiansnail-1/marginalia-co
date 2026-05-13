import { readFileSync, writeFileSync } from "node:fs";

const path = "data/curated-books.json";
const books = JSON.parse(readFileSync(path, "utf8"));

function articleFor(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function humanList(items) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function blurb(book) {
  if (book.description) return book.description;
  const subjects = (book.subjects ?? []).slice(0, 4);
  const primary = subjects[0] ?? "literary";
  const rest = subjects.slice(1, 4);
  const year = book.publishedYear ? ` from ${book.publishedYear}` : "";
  const tail = rest.length ? `, touching on ${humanList(rest)}` : "";
  return `${book.title} is ${articleFor(primary)} ${primary} work${year} by ${book.author}${tail}.`;
}

const enriched = books.map((book) => ({
  ...book,
  description: blurb(book),
}));

writeFileSync(path, `${JSON.stringify(enriched, null, 2)}\n`);
console.log(`Added/kept blurbs for ${enriched.length} curated books.`);

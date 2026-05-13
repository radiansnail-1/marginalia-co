import { normalizeIsbn } from "./isbn.ts";

export type GoodreadsImportStatus = "pile" | "reading" | "finished" | "abandoned";

export type GoodreadsImportRow = {
  title: string;
  author: string;
  isbn13: string | null;
  status: GoodreadsImportStatus;
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type GoodreadsParseResult = {
  rows: GoodreadsImportRow[];
  skipped: number;
  counts: Record<GoodreadsImportStatus, number>;
};

type CsvRow = Record<string, string>;

const EMPTY_COUNTS: Record<GoodreadsImportStatus, number> = {
  pile: 0,
  reading: 0,
  finished: 0,
  abandoned: 0,
};

export function parseGoodreadsCsv(text: string): GoodreadsParseResult {
  const csvRows = parseCsv(text);
  const seen = new Set<string>();
  const rows: GoodreadsImportRow[] = [];
  let skipped = 0;

  for (const row of csvRows) {
    const title = pick(row, ["Title", "Book Title", "bookTitle", "title"]);
    const author = pick(row, ["Author", "Author l-f", "authorName", "author"]);
    if (!title || !author) {
      skipped++;
      continue;
    }

    const isbn13 =
      normalizeIsbn(pick(row, ["ISBN13", "ISBN", "isbn13", "isbn"]) ?? "") ??
      null;
    const key = isbn13 ?? `${normalize(title)}|${normalize(author)}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);

    const status = mapGoodreadsStatus(
      pick(row, ["Exclusive Shelf", "Bookshelves", "My Bookshelves", "Shelf", "status"]) ?? "",
    );
    const rating = parseRating(pick(row, ["My Rating", "Rating", "rating"]));
    rows.push({
      title: title.trim(),
      author: author.trim(),
      isbn13,
      status,
      rating,
      startedAt: parseGoodreadsDate(pick(row, ["Date Started", "Started At", "started_at"])),
      finishedAt: parseGoodreadsDate(pick(row, ["Date Read", "Read At", "finished_at"])),
    });
  }

  const counts = { ...EMPTY_COUNTS };
  for (const row of rows) counts[row.status]++;
  return { rows, skipped, counts };
}

export function mapGoodreadsStatus(shelfText: string): GoodreadsImportStatus {
  const shelf = shelfText.toLowerCase();
  if (/\b(dnf|did[- ]?not[- ]?finish|abandon|abandoned|set[- ]?aside)\b/.test(shelf)) return "abandoned";
  if (shelf.includes("currently-reading")) return "reading";
  if (shelf.includes("read") && !shelf.includes("to-read")) return "finished";
  if (shelf.includes("to-read") || shelf.includes("want-to-read")) return "pile";
  return "pile";
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
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
    .filter((r) => r.some((value) => value.trim()))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ""])));
}

function pick(row: CsvRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return stripExportQuoting(value);
  }
  return null;
}

function stripExportQuoting(value: string): string {
  let out = value.trim();
  if (out.startsWith("=")) out = out.slice(1).trim();
  if (out.startsWith('"') && out.endsWith('"')) out = out.slice(1, -1);
  return out.trim();
}

function parseRating(value: string | null): number | null {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating <= 0) return null;
  return Math.max(0.5, Math.min(5, Math.round(rating * 2) / 2));
}

function parseGoodreadsDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeIsbn(input: string): string | null {
  const raw = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (raw.length === 10 && isValidIsbn10(raw)) return raw;
  if (raw.length === 13 && isValidIsbn13(raw)) return raw;
  return null;
}

export function isbnSearchQuery(input: string): string | null {
  const isbn = normalizeIsbn(input);
  return isbn ? `isbn:${isbn}` : null;
}

function isValidIsbn10(isbn: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = isbn[i];
    const value = ch === "X" && i === 9 ? 10 : Number(ch);
    if (!Number.isInteger(value)) return false;
    sum += value * (10 - i);
  }
  return sum % 11 === 0;
}

function isValidIsbn13(isbn: string): boolean {
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const value = Number(isbn[i]);
    if (!Number.isInteger(value)) return false;
    sum += value * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

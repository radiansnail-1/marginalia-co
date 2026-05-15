import type { BookInput } from "./books-schema";

export type ExistingUserBook = {
  id: string;
  status?: string | null;
  rating?: number | null;
  review?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
} | null;

export type ExistingBookCandidate = {
  title?: string | null;
  author?: string | null;
};

export function normalizeBookText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function authorMatches(expected: string, candidate: string) {
  const a = normalizeBookText(expected);
  const b = normalizeBookText(candidate);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const last = a.split(" ").at(-1);
  return !!last && b.split(" ").includes(last);
}

export function titleMatches(expected: string, candidate: string) {
  const a = normalizeBookText(expected);
  const b = normalizeBookText(candidate);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

export function authorSearchToken(author: string) {
  return normalizeBookText(author).split(" ").filter(Boolean).at(-1) ?? "";
}

export function chooseExistingBookCandidate<T extends ExistingBookCandidate>(
  input: Pick<BookInput, "title" | "author">,
  candidates: T[],
) {
  return candidates.find((candidate) =>
    candidate.title &&
    candidate.author &&
    titleMatches(input.title, candidate.title) &&
    authorMatches(input.author, candidate.author),
  ) ?? null;
}

export function buildUserBookPayload(
  userId: string,
  bookId: string,
  input: BookInput,
  existing: ExistingUserBook,
  now: string,
) {
  const nextStatus = input.status ?? existing?.status ?? "pile";
  const hasRating = Object.prototype.hasOwnProperty.call(input, "rating");
  const hasReview = Object.prototype.hasOwnProperty.call(input, "review");
  const rating = hasRating ? input.rating ?? null : existing?.rating ?? null;
  const review = hasReview
    ? typeof input.review === "string"
      ? input.review.trim().slice(0, 4000) || null
      : null
    : existing?.review ?? null;

  return {
    user_id: userId,
    book_id: bookId,
    status: nextStatus,
    rating,
    review,
    started_at: input.startedAt ?? (nextStatus === "reading" || nextStatus === "finished" ? existing?.started_at ?? now : null),
    finished_at: input.finishedAt ?? (nextStatus === "finished" ? existing?.finished_at ?? now : null),
    added_to_pile_at: existing ? undefined : now,
    added_from: "api",
  };
}

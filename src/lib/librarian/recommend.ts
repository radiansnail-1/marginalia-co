import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { searchBooks, type GoogleBook } from "@/lib/books/google-books";
import {
  bookEmbeddingText,
  cosine,
  embedTexts,
  embeddingTextHash,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MAX_RUNTIME_TEXTS,
  EMBEDDING_MODEL,
} from "./embeddings";

export type Mood = "restless" | "wistful" | "curious" | "tender" | "fierce" | "lost";
export const MOODS: Mood[] = ["restless", "wistful", "curious", "tender", "fierce", "lost"];

export type Recommendation = {
  title: string;
  author: string;
  reason: string;
  fromShelf: boolean;
  bookId?: string;
  coverUrl?: string | null;
};

export type RecommendInput = {
  mood: Mood;
  userId: string;
};

export type RecommendResult = {
  mood: Mood;
  picks: Recommendation[];
  source: "embedding" | "stub";
  note?: string;
};

type ShelfBook = {
  status: "finished" | "reading" | "pile" | "abandoned";
  rating: number | null;
  review: string | null;
  bookId: string;
  googleBooksId: string | null;
  isbn13: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  subjects: string[];
  pageCount: number | null;
  publishedYear: number | null;
  averageRating: number | null;
  ratingCount: number;
  embedding: number[] | null;
  embeddingHash: string | null;
};

type Candidate = GoogleBook & {
  bookId?: string;
  source: "catalog" | "google";
  description?: string | null;
  averageRating?: number | null;
  ratingCount?: number;
  embedding?: number[];
  catalogMatchScore?: number;
  score?: number;
};

type ShelfBookRow = {
  id?: string | null;
  google_books_id?: string | null;
  isbn_13?: string | null;
  title?: string | null;
  author?: string | null;
  cover_url?: string | null;
  description?: string | null;
  subjects?: string[] | null;
  page_count?: number | null;
  published_year?: number | null;
  average_rating?: number | string | null;
  rating_count?: number | null;
  embedding?: unknown;
  embedding_model?: string | null;
  embedding_dimensions?: number | null;
  embedding_text_hash?: string | null;
};

type ShelfRow = {
  status: string | null;
  rating: number | null;
  review: string | null;
  book: ShelfBookRow | ShelfBookRow[] | null;
};

function mapShelfRows(rows: ShelfRow[] | null, includeEmbeddings: boolean): ShelfBook[] {
  return (rows ?? []).flatMap((row) => {
    const b = Array.isArray(row.book) ? row.book[0] : row.book;
    if (!b?.id || !b?.title || !b?.author) return [];
    const text = bookEmbeddingText({
      title: b.title,
      author: b.author,
      description: b.description,
      subjects: b.subjects,
      pageCount: b.page_count,
      publishedYear: b.published_year,
    });
    const hash = embeddingTextHash(text);
    const embedding =
      includeEmbeddings &&
      b.embedding_model === EMBEDDING_MODEL &&
      b.embedding_dimensions === EMBEDDING_DIMENSIONS &&
      b.embedding_text_hash === hash &&
      Array.isArray(b.embedding)
        ? (b.embedding as number[])
        : null;

    return [{
      status: row.status as ShelfBook["status"],
      rating: row.rating,
      review: row.review ?? null,
      bookId: b.id,
      googleBooksId: b.google_books_id ?? null,
      isbn13: b.isbn_13 ?? null,
      title: b.title,
      author: b.author,
      coverUrl: b.cover_url ?? null,
      description: b.description ?? null,
      subjects: (b.subjects ?? []).slice(0, 8),
      pageCount: b.page_count ?? null,
      publishedYear: b.published_year ?? null,
      averageRating: b.average_rating === null || b.average_rating === undefined ? null : Number(b.average_rating),
      ratingCount: Number(b.rating_count ?? 0),
      embedding,
      embeddingHash: hash,
    }];
  });
}

// Pull the user's recent/high-rated shelf as the seed.
async function loadUserShelf(userId: string): Promise<ShelfBook[]> {
  const supabase = await createClient();
  const loadRows = (select: string) =>
    supabase
      .from("user_books")
      .select(select)
      .eq("user_id", userId)
      .in("status", ["finished", "reading", "pile", "abandoned"])
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(40)
      .returns<ShelfRow[]>();

  const { data, error } = await loadRows(
    "status, rating, review, finished_at, book:books(id, google_books_id, isbn_13, title, author, cover_url, description, subjects, page_count, published_year, average_rating, rating_count, embedding, embedding_model, embedding_dimensions, embedding_text_hash)",
  );

  if (!error) return mapShelfRows(data, true);

  const { data: fallbackData } = await loadRows(
    "status, rating, review, finished_at, book:books(id, google_books_id, isbn_13, title, author, cover_url, description, subjects, page_count, published_year, average_rating, rating_count)",
  );

  return mapShelfRows(fallbackData, false);
}

const moodCopy: Record<Mood, string> = {
  restless: "propulsive pacing, movement, tension, sharp turns",
  wistful: "memory, longing, quiet ache, reflective literary fiction",
  curious: "ideas, science, history, systems, a strong argument",
  tender: "warmth, intimacy, care, found family, gentle character work",
  fierce: "courage, resistance, ambition, conflict, moral force",
  lost: "orientation, meaning, recovery, quiet guidance, hope",
};

const moodQueries: Record<Mood, string[]> = {
  restless: ["fast paced literary fiction", "page turner adventure novel"],
  wistful: ["wistful literary fiction memory", "quiet reflective novel"],
  curious: ["popular science big ideas books", "history ideas nonfiction"],
  tender: ["warm character driven novel", "found family contemporary fiction"],
  fierce: ["fierce feminist novel", "political resistance fiction"],
  lost: ["books about finding meaning", "gentle hopeful literary fiction"],
};

function shelfKey(title: string, author: string) {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
}

function averageVectors(items: Array<{ vector: number[]; weight: number }>): number[] | null {
  if (items.length === 0) return null;
  const dims = items[0].vector.length;
  const out = Array.from({ length: dims }, () => 0);
  let total = 0;
  for (const item of items) {
    total += item.weight;
    for (let i = 0; i < dims; i++) out[i] += item.vector[i] * item.weight;
  }
  return out.map((v) => v / total);
}

function likedShelf(shelf: ShelfBook[]) {
  const liked = shelf
    .filter((b) => b.status === "finished" && (b.rating ?? 0) >= 4)
    .slice(0, 14);
  return liked.length ? liked : shelf.filter((b) => b.status !== "pile").slice(0, 10);
}

function buildQueries(mood: Mood, shelf: ShelfBook[]) {
  const subjects = new Map<string, number>();
  const authors: string[] = [];
  for (const b of likedShelf(shelf)) {
    if ((b.rating ?? 0) >= 4.5) authors.push(b.author);
    for (const s of b.subjects.slice(0, 3)) {
      const key = s.toLowerCase();
      subjects.set(key, (subjects.get(key) ?? 0) + (b.rating ?? 4));
    }
  }
  const topSubjects = [...subjects.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s]) => s);

  return [
    ...moodQueries[mood],
    ...topSubjects.map((s) => `${s} books`),
    ...authors.slice(0, 1).map((a) => `books like ${a}`),
  ].slice(0, 4);
}

const QUERY_STOP_WORDS = new Set([
  "book",
  "books",
  "novel",
  "fiction",
  "nonfiction",
  "like",
  "about",
  "with",
  "into",
  "tonight",
]);

function queryTerms(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 3 && !QUERY_STOP_WORDS.has(term))
    .slice(0, 6);
}

function safePostgrestTerm(term: string) {
  return term.replace(/[%(),]/g, "").trim();
}

function metadataText(book: Pick<GoogleBook, "title" | "author" | "subjects">) {
  return [book.title, book.author, ...book.subjects].join(" ").toLowerCase();
}

type CatalogBookRow = {
  id: string;
  google_books_id: string | null;
  isbn_13: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  subjects: string[] | null;
  page_count: number | null;
  published_year: number | null;
  average_rating: number | string | null;
  rating_count: number | null;
  embedding: unknown;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  embedding_text_hash: string | null;
};

function mapCatalogCandidate(row: CatalogBookRow, terms: string[]): Candidate | null {
  if (!Array.isArray(row.embedding)) return null;
  const subjects = row.subjects ?? [];
  const text = bookEmbeddingText({
    title: row.title,
    author: row.author,
    description: row.description,
    subjects,
    pageCount: row.page_count,
    publishedYear: row.published_year,
  });
  if (
    row.embedding_model !== EMBEDDING_MODEL ||
    row.embedding_dimensions !== EMBEDDING_DIMENSIONS ||
    row.embedding_text_hash !== embeddingTextHash(text)
  ) {
    return null;
  }

  const haystack = metadataText({ title: row.title, author: row.author, subjects });
  const matchCount = terms.filter((term) => haystack.includes(term)).length;
  return {
    source: "catalog",
    bookId: row.id,
    googleBooksId: row.google_books_id ?? "",
    isbn13: row.isbn_13,
    title: row.title,
    author: row.author,
    description: row.description,
    pageCount: row.page_count,
    publishedYear: row.published_year,
    subjects,
    thumbnail: row.cover_url,
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
    ratingCount: Number(row.rating_count ?? 0),
    embedding: row.embedding as number[],
    catalogMatchScore: matchCount ? Math.min(0.08, matchCount * 0.02) : 0,
  };
}

async function loadCatalogCandidates(queries: string[], shelf: ShelfBook[]): Promise<Candidate[]> {
  try {
    const service = createServiceClient();
    const seenShelf = new Set(shelf.map((b) => shelfKey(b.title, b.author)));
    const batches = await Promise.allSettled(queries.map(async (query) => {
      const terms = queryTerms(query);
      const safeTerms = terms.map(safePostgrestTerm).filter(Boolean);
      let request = service
        .from("books")
        .select("id, google_books_id, isbn_13, title, author, cover_url, description, subjects, page_count, published_year, average_rating, rating_count, embedding, embedding_model, embedding_dimensions, embedding_text_hash")
        .not("embedding", "is", null)
        .eq("embedding_model", EMBEDDING_MODEL)
        .eq("embedding_dimensions", EMBEDDING_DIMENSIONS)
        .order("rating_count", { ascending: false })
        .limit(40);

      if (safeTerms.length > 0) {
        request = request.or(safeTerms.flatMap((term) => [
          `title.ilike.%${term}%`,
          `author.ilike.%${term}%`,
        ]).join(","));
      }

      const { data } = await request.returns<CatalogBookRow[]>();
      return (data ?? []).flatMap((row) => {
        const candidate = mapCatalogCandidate(row, terms);
        if (!candidate || seenShelf.has(shelfKey(candidate.title, candidate.author))) return [];
        return [candidate];
      });
    }));

    const seen = new Set<string>();
    const out: Candidate[] = [];
    for (const batch of batches) {
      if (batch.status !== "fulfilled") continue;
      for (const candidate of batch.value) {
        const key = candidate.googleBooksId || shelfKey(candidate.title, candidate.author);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(candidate);
        if (out.length >= 24) return out;
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function loadWorldCandidates(mood: Mood, shelf: ShelfBook[]): Promise<Candidate[]> {
  const seenShelf = new Set(shelf.map((b) => shelfKey(b.title, b.author)));
  const seenGoogle = new Set(shelf.map((b) => b.googleBooksId).filter(Boolean));
  const queries = buildQueries(mood, shelf);
  const [catalog, batches] = await Promise.all([
    loadCatalogCandidates(queries, shelf),
    withTimeout(
      Promise.allSettled(queries.map((q) => searchBooks(q, 6))),
      3500,
      [] as PromiseSettledResult<GoogleBook[]>[],
    ),
  ]);
  const seen = new Set<string>();
  const out: Candidate[] = catalog.slice(0, 18);

  for (const candidate of out) {
    seen.add(candidate.googleBooksId || shelfKey(candidate.title, candidate.author));
  }

  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const book of batch.value) {
      const key = book.googleBooksId || shelfKey(book.title, book.author);
      if (seen.has(key) || seenGoogle.has(book.googleBooksId) || seenShelf.has(shelfKey(book.title, book.author))) continue;
      seen.add(key);
      out.push({ ...book, source: "google" });
      if (out.length >= 24) return out;
    }
  }

  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

async function tryCacheBookEmbedding(book: ShelfBook | Candidate, vector: number[]) {
  try {
    const service = createServiceClient();
    const text = bookEmbeddingText({
      title: book.title,
      author: book.author,
      description: "description" in book ? book.description : null,
      subjects: book.subjects,
      pageCount: book.pageCount,
      publishedYear: book.publishedYear,
    });
    const payload = {
      embedding: vector,
      embedding_model: EMBEDDING_MODEL,
      embedding_dimensions: EMBEDDING_DIMENSIONS,
      embedding_text_hash: embeddingTextHash(text),
      embedded_at: new Date().toISOString(),
    };

    if ("bookId" in book && book.bookId) {
      await service.from("books").update(payload).eq("id", book.bookId);
      return;
    }

    if ("googleBooksId" in book && book.googleBooksId) {
      const { data } = await service
        .from("books")
        .upsert({
          google_books_id: book.googleBooksId,
          isbn_13: book.isbn13,
          title: book.title,
          author: book.author,
          page_count: book.pageCount,
          published_year: book.publishedYear,
          subjects: book.subjects,
          cover_url: "thumbnail" in book ? book.thumbnail : book.coverUrl,
          ...payload,
        }, { onConflict: "google_books_id" })
        .select("id")
        .maybeSingle();
      if (data?.id) book.bookId = data.id as string;
    }
  } catch {
    // Caching is an optimization; recommendations should still work without it.
  }
}

async function hydrateCandidateCache(candidates: Candidate[]) {
  try {
    const service = createServiceClient();
    const ids = candidates.map((c) => c.googleBooksId).filter(Boolean);
    if (ids.length === 0) return;
    const { data } = await service
      .from("books")
      .select("id, google_books_id, cover_url, description, average_rating, rating_count, embedding, embedding_model, embedding_dimensions, embedding_text_hash")
      .in("google_books_id", ids);

    const byGoogleId = new Map((data ?? []).map((row) => [row.google_books_id as string, row]));
    for (const c of candidates) {
      const row = byGoogleId.get(c.googleBooksId);
      if (!row) continue;
      c.bookId = row.id as string;
      c.averageRating = row.average_rating === null || row.average_rating === undefined ? null : Number(row.average_rating);
      c.ratingCount = Number(row.rating_count ?? 0);
      c.description = c.description ?? ((row.description as string | null) ?? null);
      c.thumbnail = c.thumbnail ?? ((row.cover_url as string | null) ?? null);
      const text = bookEmbeddingText({
        title: c.title,
        author: c.author,
        description: c.description,
        subjects: c.subjects,
        pageCount: c.pageCount,
        publishedYear: c.publishedYear,
      });
      if (
        row.embedding_model === EMBEDDING_MODEL &&
        row.embedding_dimensions === EMBEDDING_DIMENSIONS &&
        row.embedding_text_hash === embeddingTextHash(text) &&
        Array.isArray(row.embedding)
      ) {
        c.embedding = row.embedding as number[];
      }
    }
  } catch {
    // Optional cache read.
  }
}

function positiveReviewBoost(review: string | null) {
  if (!review) return 0;
  const text = review.toLowerCase();
  let boost = 0;
  if (/\b(love|loved|favorite|favourite|beautiful|brilliant|excellent|perfect)\b/.test(text)) boost += 0.25;
  if (/\b(moved|stayed with me|could not stop|couldn't stop)\b/.test(text)) boost += 0.2;
  return Math.min(0.45, boost);
}

function negativeReviewBoost(review: string | null) {
  if (!review) return 0;
  const text = review.toLowerCase();
  let boost = 0;
  if (/\b(boring|slow|hated|disappointed|flat|tedious)\b/.test(text)) boost += 0.25;
  if (/\b(did not finish|dnf|gave up|not for me)\b/.test(text)) boost += 0.25;
  return Math.min(0.5, boost);
}

function likedWeight(book: ShelfBook) {
  const rating = book.rating ?? (book.status === "reading" ? 4 : 0);
  if (book.status !== "finished" && book.status !== "reading") return 0;
  if (rating < 3.5) return 0;
  return Math.max(0.6, rating - 3) + positiveReviewBoost(book.review);
}

function dislikedWeight(book: ShelfBook) {
  const rating = book.rating ?? 0;
  if (book.status === "abandoned") return 1.4 + negativeReviewBoost(book.review);
  if (rating > 0 && rating <= 2.5) return 3 - rating + negativeReviewBoost(book.review);
  return 0;
}

function buildTasteProfiles(shelf: ShelfBook[]) {
  const liked = averageVectors(
    shelf
      .filter((b): b is ShelfBook & { embedding: number[] } => !!b.embedding)
      .map((b) => ({ vector: b.embedding, weight: likedWeight(b) }))
      .filter((item) => item.weight > 0),
  );
  const disliked = averageVectors(
    shelf
      .filter((b): b is ShelfBook & { embedding: number[] } => !!b.embedding)
      .map((b) => ({ vector: b.embedding, weight: dislikedWeight(b) }))
      .filter((item) => item.weight > 0),
  );
  return { liked, disliked };
}

function textForCandidate(candidate: Candidate) {
  return bookEmbeddingText({
    title: candidate.title,
    author: candidate.author,
    description: candidate.description,
    subjects: candidate.subjects,
    pageCount: candidate.pageCount,
    publishedYear: candidate.publishedYear,
  });
}

async function hydrateMissingEmbeddings(shelf: ShelfBook[], candidates: Candidate[], mood: Mood) {
  const remainingBudget = Math.max(0, EMBEDDING_MAX_RUNTIME_TEXTS);
  if (remainingBudget === 0) return;

  const shelfMissing = shelf
    .filter((b) => !b.embedding && (likedWeight(b) > 0 || dislikedWeight(b) > 0))
    .slice(0, Math.min(remainingBudget, 4));
  const candidateBudget = Math.max(0, remainingBudget - shelfMissing.length);
  const candidateMissing = candidates
    .filter((c) => !c.embedding)
    .sort((a, b) => metadataBoost(b, shelf, mood) - metadataBoost(a, shelf, mood))
    .slice(0, candidateBudget);

  const texts = [
    ...shelfMissing.map((b) => bookEmbeddingText(b)),
    ...candidateMissing.map(textForCandidate),
  ];
  const vectors = await embedTexts(texts);
  if (!vectors) return;

  let cursor = 0;
  for (const book of shelfMissing) {
    const vector = vectors[cursor++];
    if (!vector) break;
    book.embedding = vector;
    void tryCacheBookEmbedding(book, vector);
  }
  for (const candidate of candidateMissing) {
    const vector = vectors[cursor++];
    if (!vector) break;
    candidate.embedding = vector;
  }
}

async function embeddingRecommendations(mood: Mood, shelf: ShelfBook[]): Promise<Recommendation[] | null> {
  const candidates = await loadWorldCandidates(mood, shelf);
  if (candidates.length === 0) return null;
  await hydrateCandidateCache(candidates);
  await hydrateMissingEmbeddings(shelf, candidates, mood);

  const profiles = buildTasteProfiles(shelf);
  const ranked = candidates
    .map((c) => ({
      ...c,
      score: recommendationScore(c, profiles, shelf, mood),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  await Promise.all(ranked.flatMap((c) => c.embedding ? [tryCacheBookEmbedding(c, c.embedding)] : []));

  return ranked.map((c) => ({
    title: c.title,
    author: c.author,
    reason: reasonFor(c, shelf, mood),
    fromShelf: false,
    bookId: c.bookId,
    coverUrl: c.thumbnail,
  }));
}

function globalQualityBoost(candidate: Candidate) {
  const average = candidate.averageRating;
  const count = candidate.ratingCount ?? 0;
  if (!average || count <= 0) return 0;
  const confidence = Math.min(1, Math.log10(count + 1) / 2);
  return ((average - 3.5) / 1.5) * 0.08 * confidence;
}

function recommendationScore(
  candidate: Candidate,
  profiles: { liked: number[] | null; disliked: number[] | null },
  shelf: ShelfBook[],
  mood: Mood,
) {
  let score = metadataBoost(candidate, shelf, mood) + globalQualityBoost(candidate) + (candidate.catalogMatchScore ?? 0);
  if (candidate.embedding && profiles.liked) {
    score += cosine(profiles.liked, candidate.embedding) * 0.65;
  }
  if (candidate.embedding && profiles.disliked) {
    score -= Math.max(0, cosine(profiles.disliked, candidate.embedding)) * 0.25;
  }
  return score;
}

function metadataBoost(candidate: Candidate, shelf: ShelfBook[], mood: Mood) {
  let score = 0;
  const likedSubjects = new Set(likedShelf(shelf).flatMap((b) => b.subjects.map((s) => s.toLowerCase())));
  for (const subject of candidate.subjects) {
    const s = subject.toLowerCase();
    if ([...likedSubjects].some((liked) => s.includes(liked) || liked.includes(s))) score += 0.03;
  }
  if (candidate.subjects.some((s) => moodCopy[mood].toLowerCase().includes(s.toLowerCase()))) score += 0.02;
  if (candidate.thumbnail) score += 0.01;
  if (candidate.source === "catalog" && candidate.embedding) score += 0.02;
  return score;
}

function reasonFor(candidate: Candidate, shelf: ShelfBook[], mood: Mood) {
  const liked = likedShelf(shelf);
  const matchedSubject = candidate.subjects.find((subject) =>
    liked.some((b) => b.subjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(subject.toLowerCase()))),
  );
  if (matchedSubject) {
    return `It echoes your taste for ${matchedSubject.toLowerCase()}, while leaning into tonight's ${mood} mood.`;
  }
  return `It sits close to the shape of books you have rated highly, with a ${mood} edge for tonight.`;
}

function stubRecommendations(mood: Mood, shelf: ShelfBook[]): Recommendation[] {
  const top = likedShelf(shelf).slice(0, 3);
  if (top.length === 0) {
    return [
      {
        title: "An empty shelf is its own kind of invitation",
        author: "The Librarian",
        reason: `Add a few volumes first; the Librarian needs a little taste signal before matching your ${mood} mood.`,
        fromShelf: false,
      },
    ];
  }
  return top.map((b) => ({
    title: b.title,
    author: b.author,
    reason: `You rated this ${b.rating ?? "well"}; it is already a trusted match for a ${mood} night.`,
    fromShelf: true,
    bookId: b.bookId,
    coverUrl: b.coverUrl,
  }));
}

export async function recommend(input: RecommendInput): Promise<RecommendResult> {
  const shelf = await loadUserShelf(input.userId);
  const picks = await embeddingRecommendations(input.mood, shelf);

  if (picks?.length) {
    return {
      mood: input.mood,
      picks,
      source: "embedding",
      note: "Ranked from world-book candidates using your ratings, global ratings, subjects, and cached embeddings where available.",
    };
  }

  return {
    mood: input.mood,
    picks: stubRecommendations(input.mood, shelf),
    source: "stub",
    note: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY
      ? "The Librarian fell back to your shelf because live world candidates were unavailable."
      : "Add EMBEDDING_API_KEY only if you want capped cache-on-miss embeddings; cached recommendations work without one.",
  };
}

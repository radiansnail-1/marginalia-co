import { cleanOnboardingAnswers, type OnboardingAnswers } from "./onboarding.ts";

type ScoreMap = Record<string, number>;

type FirstRecommendationCandidate = {
  title: string;
  author: string;
  coverUrl: string;
  publishedYear: number;
  capsule: string;
  intentScores: ScoreMap;
  avoidScores: ScoreMap;
};

export type FirstRecommendation = {
  title: string;
  author: string;
  coverUrl: string;
  publishedYear: number;
  reason: string;
};

const CANDIDATES: FirstRecommendationCandidate[] = [
  {
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780061054884-L.jpg",
    publishedYear: 1974,
    capsule: "political ideas disguised as a human story",
    intentScores: { Sharper: 6, Braver: 3, Stranger: 1 },
    avoidScores: { "Plot without consequence": 4, "Academic fog": 2, "Over-neat productivity": 1 },
  },
  {
    title: "Braiding Sweetgrass",
    author: "Robin Wall Kimmerer",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781571313560-L.jpg",
    publishedYear: 2013,
    capsule: "science, attention, and care with actual weather in it",
    intentScores: { Steadier: 6, Sharper: 2, Tender: 2 },
    avoidScores: { "Academic fog": 4, "400 pages of vague advice": 2 },
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781635575637-L.jpg",
    publishedYear: 2020,
    capsule: "strangeness with clean emotional architecture",
    intentScores: { Stranger: 7, Steadier: 1 },
    avoidScores: { "Plot without consequence": 2, "Academic fog": 2 },
  },
  {
    title: "Parable of the Sower",
    author: "Octavia E. Butler",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780446675505-L.jpg",
    publishedYear: 1993,
    capsule: "survival, courage, and belief under pressure",
    intentScores: { Braver: 7, Sharper: 2, Stranger: 1 },
    avoidScores: { "Plot without consequence": 4, "Over-neat productivity": 2 },
  },
  {
    title: "A Psalm for the Wild-Built",
    author: "Becky Chambers",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781250236210-L.jpg",
    publishedYear: 2021,
    capsule: "a gentle reset that refuses to turn life into a checklist",
    intentScores: { Steadier: 5, Stranger: 2 },
    avoidScores: { "Over-neat productivity": 5, "400 pages of vague advice": 2 },
  },
  {
    title: "How to Do Nothing",
    author: "Jenny Odell",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781612197494-L.jpg",
    publishedYear: 2019,
    capsule: "an argument for attention that has teeth",
    intentScores: { Sharper: 4, Steadier: 2, Braver: 1 },
    avoidScores: { "Over-neat productivity": 5, "400 pages of vague advice": 3 },
  },
  {
    title: "The Fire Next Time",
    author: "James Baldwin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780679744726-L.jpg",
    publishedYear: 1963,
    capsule: "moral force, style, and clarity without padding",
    intentScores: { Braver: 6, Sharper: 3 },
    avoidScores: { "400 pages of vague advice": 4, "Academic fog": 2 },
  },
  {
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780547773742-L.jpg",
    publishedYear: 1968,
    capsule: "mythic strangeness where every choice leaves a mark",
    intentScores: { Stranger: 6, Braver: 1, Steadier: 1 },
    avoidScores: { "Plot without consequence": 4, "400 pages of vague advice": 1 },
  },
];

function scoreFor(map: ScoreMap, key: string) {
  return map[key] ?? 0;
}

function stableTieBreak(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return hash / 100000;
}

export function selectFirstRecommendation(answers: OnboardingAnswers): FirstRecommendation {
  const cleaned = cleanOnboardingAnswers(answers);
  const seed = `${cleaned.intent}|${cleaned.avoid}`;
  const pick = CANDIDATES
    .map((book) => ({
      book,
      score:
        scoreFor(book.intentScores, cleaned.intent) +
        scoreFor(book.avoidScores, cleaned.avoid) +
        stableTieBreak(`${seed}|${book.title}`),
    }))
    .sort((a, b) => b.score - a.score)[0]?.book ?? CANDIDATES[0];

  return {
    title: pick.title,
    author: pick.author,
    coverUrl: pick.coverUrl,
    publishedYear: pick.publishedYear,
    reason: `For a ${cleaned.intent.toLowerCase()} shelf that avoids ${cleaned.avoid.toLowerCase()}: ${pick.capsule}.`,
  };
}

import "server-only";
import { createClient } from "@/lib/supabase/server";

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
  source: "claude" | "stub";
  note?: string;
};

// Pull the user's most recently finished + highest-rated books as the seed.
async function loadUserShelf(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_books")
    .select("status, rating, finished_at, book:books(id, title, author, cover_url, subjects)")
    .eq("user_id", userId)
    .in("status", ["finished", "reading", "pile"])
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(30);
  return (data ?? []).map((row) => {
    const b = Array.isArray(row.book) ? row.book[0] : row.book;
    return {
      status: row.status as "finished" | "reading" | "pile",
      rating: row.rating as number | null,
      bookId: b?.id as string | undefined,
      title: b?.title as string | undefined,
      author: b?.author as string | undefined,
      coverUrl: (b?.cover_url as string | null | undefined) ?? null,
      subjects: ((b?.subjects as string[] | undefined) ?? []).slice(0, 4),
    };
  });
}

const moodCopy: Record<Mood, string> = {
  restless: "wants forward motion, sharp pacing, a book that won't sit still",
  wistful: "wants slow light, memory, gentle ache",
  curious: "wants ideas, a real argument, something to turn over",
  tender: "wants warmth, characters worth caring about, soft landings",
  fierce: "wants courage, a fight, a refusal to flinch",
  lost: "wants a hand on the shoulder, orientation, a quiet north",
};

function stubRecommendations(mood: Mood, shelf: Awaited<ReturnType<typeof loadUserShelf>>): Recommendation[] {
  const finished = shelf.filter((s) => s.status === "finished" && s.title);
  const candidates = finished.length > 0 ? finished : shelf.filter((s) => s.title);
  const top = candidates.slice(0, 3);
  if (top.length === 0) {
    return [
      {
        title: "An empty shelf is its own kind of invitation",
        author: "The Librarian",
        reason: `Add a few volumes first — the Librarian needs to know what you read before they can match your ${mood} mood.`,
        fromShelf: false,
      },
    ];
  }
  return top.map((b) => ({
    title: b.title ?? "Untitled",
    author: b.author ?? "Unknown",
    reason: `You rated this ${b.rating ?? "well"}. Tonight you're ${mood} — a re-read of something already trusted is a calm choice.`,
    fromShelf: true,
    bookId: b.bookId,
    coverUrl: b.coverUrl,
  }));
}

export async function recommend(input: RecommendInput): Promise<RecommendResult> {
  const shelf = await loadUserShelf(input.userId);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { mood: input.mood, picks: stubRecommendations(input.mood, shelf), source: "stub" };
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });
    const shelfSummary = shelf
      .filter((b) => b.title)
      .slice(0, 12)
      .map((b) => `- "${b.title}" by ${b.author} [${b.status}${b.rating ? `, rated ${b.rating}/5` : ""}${b.subjects.length ? `, ${b.subjects.join(", ")}` : ""}]`)
      .join("\n");

    const prompt = `You are the Librarian at Marginalia & Co., a cozy dark-academia reading room. Your job: recommend exactly 3 books for tonight.

Reader's mood: ${input.mood} — ${moodCopy[input.mood]}.

Reader's shelf:
${shelfSummary || "(empty — recommend gateway books that match the mood)"}

Constraints:
- If three books on the shelf fit the mood, recommend them and explain why each fits tonight specifically. Mark fromShelf: true.
- If the shelf is thin or off-mood, recommend at most 1 from the shelf and 2 from outside the shelf as gateways. Mark fromShelf: false for outside picks.
- Each "reason" is one sentence, in calm Marginalia voice (no exclamation marks, no salesy language).
- Reply with ONLY a JSON object: {"picks":[{"title":"...","author":"...","reason":"...","fromShelf":true|false}, ... 3 items ...]}.`;

    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const picks = (json.picks as Recommendation[])
      .slice(0, 3)
      .map((p) => {
        const onShelf = shelf.find((b) => (b.title ?? "").toLowerCase() === p.title.toLowerCase());
        return {
          ...p,
          fromShelf: !!onShelf,
          bookId: onShelf?.bookId,
          coverUrl: onShelf?.coverUrl,
        };
      });
    return { mood: input.mood, picks, source: "claude" };
  } catch {
    return {
      mood: input.mood,
      picks: stubRecommendations(input.mood, shelf),
      source: "stub",
      note: "The Librarian is using your shelf while tonight's live picks are unavailable.",
    };
  }
}

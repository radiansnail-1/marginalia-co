import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { toRoman } from "@/lib/roman";
import { ShelfClient, type ShelfBook } from "./shelf-client";

function pick<T>(b: T | T[] | null | undefined): T | null {
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

type BookJoin = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  spine_color?: string | null;
  dominant_color: string | null;
};

export default async function ShelfPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const { data } = await supabase
    .from("user_books")
    .select("id, finished_at, rating, book:books(id, title, author, cover_url, dominant_color)")
    .eq("user_id", user?.id ?? "")
    .eq("status", "finished")
    .order("finished_at", { ascending: false });

  const books: ShelfBook[] = (data ?? [])
    .map((r) => {
      const b = pick<BookJoin>(r.book);
      if (!b) return null;
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        cover_url: b.cover_url,
        spine_color: b.spine_color ?? null,
        dominant_color: b.dominant_color,
        rating: (r.rating as number | null) ?? null,
        finished_at: (r.finished_at as string | null) ?? null,
      } satisfies ShelfBook;
    })
    .filter((b): b is ShelfBook => b !== null);

  const year = new Date().getFullYear();

  return <ShelfClient books={books} romanYear={toRoman(year)} />;
}

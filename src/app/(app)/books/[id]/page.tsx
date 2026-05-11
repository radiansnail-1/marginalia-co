import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { affiliateLinksForBook } from "@/lib/books/affiliate";
import { AffiliateLinks } from "@/components/affiliate-links";
import { ActionButtons } from "./action-buttons";

export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: book } = await supabase
    .from("books")
    .select(
      "id, title, author, cover_url, subjects, page_count, published_year, isbn_13",
    )
    .eq("id", id)
    .maybeSingle();

  if (!book) notFound();

  const { data: userBook } = user
    ? await supabase
        .from("user_books")
        .select("id, status, rating, finished_at, started_at")
        .eq("user_id", user.id)
        .eq("book_id", id)
        .maybeSingle()
    : { data: null };

  const affiliateLinks = affiliateLinksForBook({
    title: book.title,
    author: book.author,
    isbn13: book.isbn_13,
  });

  return (
    <div
      className="min-h-dvh"
      style={{
        background:
          "linear-gradient(180deg,#2c140a 0%,#1a0905 60%,#0d0907 100%)",
      }}
    >
      <div className="px-5 pt-10">
        <div className="flex items-center justify-between">
          <Link
            href="/home"
            className="font-body uppercase tracking-[2px] text-brass-bright"
            style={{ fontSize: "11px" }}
          >
            ‹ back to room
          </Link>
          <div className="font-display italic" style={{ fontSize: "14px", color: "rgba(236,220,176,0.75)" }}>
            From the shelf
          </div>
          <span style={{ width: 30 }} />
        </div>

        {/* Hero cover */}
        <div className="relative mt-6 flex h-[260px] items-center justify-center">
          <div
            className="relative h-[230px] w-[160px] overflow-hidden"
            style={{
              background: "linear-gradient(95deg,#4a1c1c 0%,#2a0e0c 100%)",
              transform: "perspective(800px) rotateY(-10deg) rotateX(4deg)",
              boxShadow:
                "-20px 30px 60px rgba(0,0,0,0.75), inset -4px 0 0 rgba(0,0,0,0.45), inset 4px 0 0 rgba(255,255,255,0.1)",
            }}
          >
            {book.cover_url ? (
              <Image src={book.cover_url} alt={book.title} fill sizes="160px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  className="spine-text font-display"
                  style={{ fontSize: "14px", padding: "18px 0", color: "rgba(236,220,176,0.9)" }}
                >
                  {book.title}
                </span>
              </div>
            )}
          </div>
        </div>

        <h1 className="mt-6 font-display" style={{ fontSize: "30px", fontWeight: 500, lineHeight: 1.05 }}>
          {book.title}
        </h1>
        <p className="mt-1 font-display italic" style={{ fontSize: "15px", color: "rgba(236,220,176,0.7)" }}>
          {book.author}
          {book.published_year ? ` · ${book.published_year}` : ""}
          {book.page_count ? ` · ${book.page_count} pp` : ""}
        </p>

        {userBook?.status === "finished" && userBook.rating && (
          <div
            className="mt-3 font-body uppercase"
            style={{ fontSize: "10px", letterSpacing: "2px", color: "rgba(236,220,176,0.55)" }}
          >
            Rated <span style={{ color: "var(--color-brass-bright)", letterSpacing: 1 }}>
              {"★".repeat(userBook.rating)}{"☆".repeat(5 - userBook.rating)}
            </span>
          </div>
        )}

        <ActionButtons bookId={book.id} userBook={userBook ?? null} />

        <AffiliateLinks links={affiliateLinks} />

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

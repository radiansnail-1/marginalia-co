"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishBook } from "@/app/(app)/reading/actions";
import { ClosingBook } from "./closing-book";

export function FinishPrompt({
  open,
  onClose,
  userBookId,
  title,
  author,
  pageCount,
}: {
  open: boolean;
  onClose: () => void;
  userBookId: string;
  title: string;
  author: string;
  pageCount: number | null;
}) {
  const router = useRouter();
  const [pages, setPages] = useState<number | "">(pageCount ?? "");
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [closing, setClosing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open && !closing) return null;

  const onSubmit = () => {
    setClosing(true);
    startTransition(async () => {
      await finishBook(
        userBookId,
        typeof pages === "number" ? pages : null,
        rating || null,
        review.trim() || null,
      );
      router.push("/home");
      router.refresh();
    });
  };

  return (
    <>
      {open && !closing && (
        <div className="fixed inset-0 z-[150] flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div
            className="parchment relative mx-auto w-full max-w-[440px] px-6 pt-7 pb-6"
            style={{
              boxShadow: "0 -20px 50px rgba(0,0,0,0.7)",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <div
              className="font-body uppercase"
              style={{ fontSize: "9px", letterSpacing: "3px", color: "#c84838" }}
            >
              — you finished it
            </div>
            <h2
              className="font-display italic"
              style={{ fontSize: "24px", color: "#2a1810", marginTop: "2px", lineHeight: 1.15 }}
            >
              How was it?
            </h2>
            <div className="font-caveat" style={{ fontSize: "17px", color: "#6a4a30", marginTop: "4px" }}>
              slip a bookmark in. close the cover.
            </div>

            <div className="mt-4 flex gap-4">
              <div
                className="relative flex h-[84px] w-[56px] shrink-0 items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(95deg,#4a1c1c 0%,#2a0e0c 100%)",
                  boxShadow: "4px 6px 12px rgba(0,0,0,0.5)",
                }}
              >
                <span
                  className="spine-text font-display"
                  style={{ fontSize: "8px", color: "rgba(236,220,176,0.9)", padding: "4px 0" }}
                >
                  {title}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display" style={{ fontSize: "17px", color: "#2a1810", fontWeight: 500, lineHeight: 1.1 }}>
                  {title}
                </div>
                <div className="font-body italic" style={{ fontSize: "11px", color: "#6a4a30", marginTop: "2px" }}>
                  {author}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div
                className="font-body uppercase"
                style={{ fontSize: "10px", letterSpacing: "2.5px", color: "#6a4a30", marginBottom: "8px" }}
              >
                — pages read
              </div>
              <div
                className="flex items-baseline gap-2 px-4 py-3"
                style={{
                  border: "1px solid rgba(106,74,48,0.4)",
                  background: "rgba(255,255,255,0.4)",
                }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  value={pages}
                  onChange={(e) => setPages(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-transparent font-display outline-none"
                  style={{ fontSize: "34px", color: "#2a1810", fontWeight: 500, lineHeight: 1 }}
                  placeholder="0"
                />
                {pageCount && (
                  <span className="font-body" style={{ fontSize: "12px", color: "#6a4a30", letterSpacing: "1px" }}>
                    of {pageCount}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div
                className="font-body uppercase"
                style={{ fontSize: "10px", letterSpacing: "2.5px", color: "#6a4a30", marginBottom: "8px" }}
              >
                — your rating
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="font-display"
                    style={{
                      fontSize: "30px",
                      color: n <= rating ? "#c84838" : "rgba(106,74,48,0.35)",
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div
                className="font-body uppercase"
                style={{ fontSize: "10px", letterSpacing: "2.5px", color: "#6a4a30", marginBottom: "8px" }}
              >
                — a few words (optional)
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="what stayed with you?"
                className="w-full px-3 py-2 font-display outline-none"
                style={{
                  fontSize: "15px",
                  lineHeight: 1.5,
                  color: "#2a1810",
                  background: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(106,74,48,0.4)",
                  resize: "vertical",
                  minHeight: "70px",
                }}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="tap flex-1 border font-body uppercase"
                style={{
                  padding: "14px",
                  fontSize: "11px",
                  letterSpacing: "2.5px",
                  fontWeight: 600,
                  color: "#6a4a30",
                  borderColor: "#6a4a30",
                  background: "transparent",
                }}
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={pending}
                className="tap flex-1 font-body uppercase"
                style={{
                  padding: "14px",
                  fontSize: "11px",
                  letterSpacing: "2.5px",
                  fontWeight: 600,
                  background: "#c84838",
                  color: "#f3e6c4",
                  border: "1px solid #c84838",
                }}
              >
                Place on the shelf
              </button>
            </div>
          </div>
        </div>
      )}
      <ClosingBook
        show={closing}
        meta={`${title} - ${rating ? "*".repeat(rating) : ""}`}
      />
    </>
  );
}

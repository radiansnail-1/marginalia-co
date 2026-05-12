"use client";

import { type MouseEvent, useState, useTransition } from "react";
import { saveReview } from "./actions";

export function ReviewEditor({
  userBookId,
  initialRating,
  initialReview,
}: {
  userBookId: string;
  initialRating: number | null;
  initialReview: string | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [review, setReview] = useState<string>(initialReview ?? "");
  const [editing, setEditing] = useState<boolean>(!initialReview && initialRating === null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");

  const onSave = () => {
    startTransition(async () => {
      const r = await saveReview(userBookId, rating, review);
      setSaved("error" in r ? "err" : "ok");
      if (!("error" in r)) setEditing(false);
    });
  };

  const onRate = (n: number, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const value = n - (event.clientX - rect.left < rect.width / 2 ? 0.5 : 0);
    setRating(rating === value ? null : value);
  };

  return (
    <section
      className="mt-8 border-t pt-6"
      style={{ borderColor: "rgba(216,176,106,0.18)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="font-body uppercase"
          style={{ fontSize: "10px", letterSpacing: "2.5px", color: "rgba(236,220,176,0.55)" }}
        >
          Your review
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => { setEditing(true); setSaved("idle"); }}
            className="tap font-body uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "2px",
              color: "var(--color-brass-bright)",
              padding: "4px 8px",
              border: "1px solid rgba(216,176,106,0.35)",
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = rating === null ? 0 : Math.max(0, Math.min(1, rating - (n - 1)));
          return (
            <button
              key={n}
              type="button"
              disabled={!editing || pending}
              onClick={(event) => onRate(n, event)}
              className="tap relative grid h-8 w-8 place-items-center font-display"
              style={{ fontSize: "28px", lineHeight: 1 }}
              aria-label={`${n - 0.5} or ${n} stars`}
            >
              <span style={{ color: "rgba(236,220,176,0.25)" }}>★</span>
              <span
                aria-hidden
                className="absolute left-0 overflow-hidden"
                style={{
                  width: `${fill * 100}%`,
                  color: "var(--color-brass-bright)",
                }}
              >
                ★
              </span>
            </button>
          );
        })}
      </div>

      {editing ? (
        <>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you make of it?"
            rows={5}
            maxLength={4000}
            className="mt-4 w-full bg-mahogany-2/50 px-4 py-3 font-display text-parchment outline-none placeholder:text-parchment-dim/50"
            style={{
              fontSize: "16px",
              lineHeight: 1.55,
              border: "1px solid rgba(216,176,106,0.25)",
              minHeight: "140px",
              resize: "vertical",
            }}
          />
          <div className="mt-3 flex items-center justify-between">
            <span
              className="font-body"
              style={{ fontSize: "10px", letterSpacing: "1.5px", color: "rgba(236,220,176,0.4)" }}
            >
              {review.length}/4000
            </span>
            <div className="flex gap-2">
              {initialReview !== null && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setReview(initialReview);
                    setRating(initialRating);
                    setEditing(false);
                    setSaved("idle");
                  }}
                  className="tap border px-4 py-2 font-body uppercase"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: "var(--color-parchment-dim)",
                    borderColor: "rgba(216,176,106,0.3)",
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={onSave}
                className="tap bg-brass px-5 py-2 font-body uppercase text-mahogany"
                style={{ fontSize: "10px", letterSpacing: "2px", fontWeight: 600 }}
              >
                {pending ? "Saving" : "Save"}
              </button>
            </div>
          </div>
          {saved === "err" && (
            <div className="mt-2 font-caveat text-sconce-glow" style={{ fontSize: "13px" }}>
              Could not save your review.
            </div>
          )}
        </>
      ) : (
        <div
          className="mt-4 font-display"
          style={{ fontSize: "16px", lineHeight: 1.55, color: "var(--color-parchment)", whiteSpace: "pre-wrap" }}
        >
          {review || (
            <span className="font-caveat" style={{ fontSize: "16px", color: "rgba(236,220,176,0.45)" }}>
              you haven&rsquo;t written anything yet.
            </span>
          )}
        </div>
      )}
    </section>
  );
}

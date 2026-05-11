"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

// Iteration-7 choreography (compressed to ~2s for snappier feel):
// 0.0–0.6s — pages fold shut over the table.
// 0.6–1.0s — "FINIS" caption settles. Halo brightens.
// 1.0–2.0s — final fade to mahogany; caller routes onward.

export function ClosingBook({
  show,
  meta,
  onDone,
}: {
  show: boolean;
  meta?: string;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), 2000);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="closing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] grid place-items-center bg-gradient-to-b from-mahogany via-mahogany to-ink"
        >
          {/* warm halo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute h-[380px] w-[380px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,181,107,0.22) 0%, rgba(255,122,85,0.10) 30%, transparent 60%)",
            }}
          />

          {/* Caption */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute left-0 right-0 top-[16%] text-center"
          >
            <div
              className="font-display uppercase"
              style={{
                fontSize: "11px",
                letterSpacing: "4px",
                color: "var(--color-brass-bright)",
              }}
            >
              — finis
            </div>
            <div
              className="font-display"
              style={{
                marginTop: "8px",
                fontSize: "36px",
                fontStyle: "italic",
                color: "var(--color-cream)",
                lineHeight: 1.05,
              }}
            >
              You&rsquo;ve <span style={{ color: "var(--color-brass-bright)" }}>finished</span> it.
            </div>
            <div
              className="font-caveat"
              style={{
                fontSize: "18px",
                color: "rgba(236,220,176,0.75)",
                marginTop: "8px",
              }}
            >
              close it gently.
            </div>
          </motion.div>

          {/* The closing book — perspective folded */}
          <div
            style={{
              position: "absolute",
              top: "44%",
              left: "50%",
              transform: "translateX(-50%) perspective(900px) rotateX(56deg)",
              transformOrigin: "center bottom",
              width: "200px",
              height: "240px",
            }}
          >
            {/* cover bottom */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "-8px",
                left: "4%",
                right: "4%",
                height: "18px",
                background: "linear-gradient(180deg,#4a1c1c 0%,#2a0e0c 100%)",
                borderRadius: "3px 3px 0 0",
                boxShadow:
                  "0 4px 14px rgba(0,0,0,0.6), inset 0 2px 0 rgba(216,176,106,0.18)",
              }}
            />
            {/* left page */}
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: -30 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "100%",
                background: "linear-gradient(95deg,#f3e6c4 0%,#d4c094 100%)",
                transformOrigin: "right center",
                boxShadow: "-6px 6px 14px rgba(0,0,0,0.5)",
                borderRight: "2px solid #1a0905",
              }}
            />
            {/* right page — main closing motion */}
            <motion.div
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 38 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "50%",
                height: "100%",
                background: "linear-gradient(95deg,#d4c094 0%,#f3e6c4 100%)",
                transformOrigin: "left center",
                boxShadow: "6px 6px 14px rgba(0,0,0,0.5)",
                borderLeft: "2px solid #1a0905",
              }}
            />
            {/* bookmark slipping out */}
            <motion.span
              aria-hidden
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 12, opacity: 0.95 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                position: "absolute",
                top: "60%",
                left: "50%",
                transform: "translateX(-50%) rotate(2deg)",
                width: "6px",
                height: "70px",
                background: "#c84838",
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                zIndex: 20,
              }}
            />
          </div>

          {/* meta line */}
          {meta && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="font-caveat absolute bottom-24 left-0 right-0 text-center"
              style={{ fontSize: "15px", color: "rgba(236,220,176,0.65)" }}
            >
              {meta}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

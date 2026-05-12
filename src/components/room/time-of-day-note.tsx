"use client";

import { useEffect, useState } from "react";

export function TimeOfDayNote() {
  const [label, setLabel] = useState("night");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setLabel(hour >= 6 && hour < 12 ? "morning" : "night");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="font-body uppercase" style={{ fontSize: "10px", letterSpacing: "2.5px", color: "rgba(236,220,176,0.6)" }}>
      {label}
    </span>
  );
}

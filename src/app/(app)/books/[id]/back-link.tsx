"use client";

import { useRouter } from "next/navigation";

export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/home");
      }}
      className="tap font-body uppercase tracking-[2px] text-brass-bright"
      style={{ fontSize: "11px" }}
    >
      {"< back"}
    </button>
  );
}

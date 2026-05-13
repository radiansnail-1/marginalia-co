import type { ReactNode } from "react";
import { TabBar } from "@/components/tab-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[440px] overflow-x-hidden md:max-w-3xl">
      <main style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>{children}</main>
      <TabBar />
    </div>
  );
}

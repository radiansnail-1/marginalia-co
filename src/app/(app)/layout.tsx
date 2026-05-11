import type { ReactNode } from "react";
import { TabBar } from "@/components/tab-bar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[440px]">
      <main className="pb-[78px]">{children}</main>
      <TabBar />
    </div>
  );
}

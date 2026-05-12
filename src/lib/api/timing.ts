import { NextResponse } from "next/server";

export class ApiTimer {
  private timings: Array<{ label: string; ms: number }> = [];

  async measure<T>(label: string, fn: () => T): Promise<Awaited<T>> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.timings.push({ label, ms: performance.now() - start });
    }
  }

  header(): string {
    return this.timings
      .map(({ label, ms }) => `${label};dur=${Math.max(0, ms).toFixed(1)}`)
      .join(", ");
  }
}

export type TimingRecorder = Pick<ApiTimer, "measure">;

export function withServerTiming<T extends NextResponse>(response: T, timer: ApiTimer): T {
  const header = timer.header();
  if (header) response.headers.set("Server-Timing", header);
  return response;
}

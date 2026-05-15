import { NextResponse } from "next/server";
import { API_REFERENCE } from "@/lib/api/reference";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(API_REFERENCE);
}

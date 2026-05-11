import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    name: "Marginalia & Co. v1",
    description: "Personal reading-shelf API. Hook up your LLM, your script, your tool of choice.",
    auth: "Authorization: Bearer mg_xxx - generate from /profile.",
    endpoints: [
      { method: "GET", path: "/api/v1/me", returns: "Your profile + this year's finished count" },
      { method: "GET", path: "/api/v1/books", query: "status=pile|reading|finished|abandoned (optional)", returns: "Your shelf" },
      { method: "POST", path: "/api/v1/books", body: { title: "string", author: "string", status: "pile|reading|finished|abandoned", rating: "1-5 (optional)", googleBooksId: "optional", isbn13: "optional", pageCount: "optional", publishedYear: "optional", coverUrl: "optional", startedAt: "ISO (optional)", finishedAt: "ISO (optional)" } },
      { method: "POST", path: "/api/v1/recommendations", body: { mood: "restless|wistful|curious|tender|fierce|lost" }, returns: "Three picks with reasons" },
    ],
    notes: [
      "Bulk import: POST /api/v1/books per book. The shared books catalog is deduped by googleBooksId then isbn13 then (title, author).",
      "Recommendations use the live Librarian when configured; otherwise a deterministic shelf-based fallback.",
      "Tokens look like mg_xxx. Revoke from /profile.",
    ],
  });
}

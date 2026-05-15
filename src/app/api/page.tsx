const endpoints = [
  ["GET", "/api/v1/me", "Verify a token and read the current profile."],
  ["GET", "/api/v1/books", "List shelf books with status, rating, and review, optionally filtered by status."],
  ["POST", "/api/v1/books", "Add or update one book, including review text and half-star ratings."],
  ["POST", "/api/v1/recommendations", "Ask the Librarian for three mood-based picks."],
];

export default function ApiDocsPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-6 py-10 text-parchment">
      <div className="mx-auto max-w-2xl">
        <p className="font-body text-xs uppercase tracking-[3px] text-brass">Marginalia & Co.</p>
        <h1 className="mt-3 font-display text-3xl text-brass-bright">API access</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-parchment-dim">
          Personal access tokens let your scripts, notebooks, or LLM tools read and write to your shelf.
          Generate a token from Profile, then send it as an Authorization bearer token.
        </p>

        <section className="mt-8 rounded-md bg-mahogany-2 p-5 ring-1 ring-brass/20">
          <h2 className="font-body text-xs uppercase tracking-[3px] text-brass">Authentication</h2>
          <code className="mt-3 block overflow-x-auto rounded bg-mahogany-3 px-3 py-2 text-xs text-parchment">
            Authorization: Bearer mg_xxx
          </code>
        </section>

        <section className="mt-5 rounded-md bg-mahogany-2 p-5 ring-1 ring-brass/20">
          <h2 className="font-body text-xs uppercase tracking-[3px] text-brass">Endpoints</h2>
          <div className="mt-4 space-y-3">
            {endpoints.map(([method, path, description]) => (
              <div key={path} className="border-b border-brass/10 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-body text-[10px] uppercase tracking-[2px] text-brass-bright">
                    {method}
                  </span>
                  <code className="text-sm text-parchment">{path}</code>
                </div>
                <p className="mt-1 text-sm text-parchment-dim">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 text-xs text-parchment-dim">
          Machine-readable reference: <a href="/api/v1" className="text-brass-bright underline">/api/v1</a>
        </p>
        <p className="mt-2 text-xs text-parchment-dim">
          Book updates support <code className="text-brass-bright">review</code> and half-star <code className="text-brass-bright">rating</code> values such as <code className="text-brass-bright">4.5</code>.
        </p>
      </div>
    </main>
  );
}

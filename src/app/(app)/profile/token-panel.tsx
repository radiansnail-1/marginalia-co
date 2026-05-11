"use client";

import { useEffect, useState, useTransition } from "react";
import { createApiToken, listTokens, revokeApiToken } from "./token-actions";

type Token = {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function TokenPanel() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [label, setLabel] = useState("");
  const [freshToken, setFreshToken] = useState<{ id: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listTokens().then((r) => {
      setTokens(r.tokens);
      setLoaded(true);
    });
  }, []);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFreshToken(null);
    startTransition(async () => {
      const res = await createApiToken(label);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setFreshToken({ id: res.id, token: res.token });
      const refreshed = await listTokens();
      setTokens(refreshed.tokens);
      setLabel("");
    });
  };

  const onRevoke = (id: string) => {
    startTransition(async () => {
      const res = await revokeApiToken(id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const refreshed = await listTokens();
      setTokens(refreshed.tokens);
      if (freshToken?.id === id) setFreshToken(null);
    });
  };

  return (
    <section className="mt-8 rounded-md bg-mahogany-2 p-5 ring-1 ring-brass/20">
      <details>
        <summary className="cursor-pointer font-display text-sm uppercase tracking-widest text-brass">
          Advanced: API access
        </summary>
        <p className="mt-3 text-sm text-parchment-dim">
          Generate a personal access token so your own script, LLM, or tool can read and write to your shelf via <code className="text-brass-bright">/api/v1</code>.
        </p>

        <form onSubmit={onCreate} className="mt-4 flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. my macbook script"
            className="flex-1 rounded-md border border-brass/30 bg-mahogany-3 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/60 focus:border-brass focus:outline-none"
          />
          <button
            disabled={pending}
            className="tap rounded-md bg-brass px-4 py-2 font-display text-sm text-mahogany disabled:opacity-60"
          >
            {pending ? "..." : "New token"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-sconce">{error}</p>}

        {freshToken && (
          <div className="mt-4 rounded-md border border-brass/40 bg-mahogany-3 p-3">
            <div className="text-[10px] uppercase tracking-widest text-brass">Copy this now - it won&apos;t be shown again</div>
            <code className="mt-2 block break-all text-xs text-parchment">{freshToken.token}</code>
          </div>
        )}

        <div className="mt-5 space-y-2">
          {!loaded && <p className="text-xs text-parchment-dim">Loading your tokens...</p>}
          {loaded && tokens.length === 0 && <p className="text-xs italic text-parchment-dim">No tokens yet.</p>}
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-md bg-mahogany-3 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-display text-parchment">
                  {t.label} <span className="text-parchment-dim">- {t.prefix}...</span>
                </div>
                <div className="text-[10px] text-parchment-dim">
                  created {new Date(t.created_at).toLocaleDateString()}
                  {t.last_used_at && <> - last used {new Date(t.last_used_at).toLocaleDateString()}</>}
                  {t.revoked_at && <> - <span className="text-sconce">revoked</span></>}
                </div>
              </div>
              {!t.revoked_at && (
                <button
                  type="button"
                  onClick={() => onRevoke(t.id)}
                  disabled={pending}
                  className="tap shrink-0 rounded-md border border-brass/40 px-2 py-1 text-[10px] uppercase tracking-widest text-brass-bright hover:bg-mahogany"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-widest text-parchment-dim">
          Docs at <a href="/api" className="text-brass-bright underline">/api</a>
        </p>
      </details>
    </section>
  );
}

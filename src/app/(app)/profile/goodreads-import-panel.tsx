"use client";

import { useState, useTransition } from "react";
import { commitGoodreadsImport, previewGoodreadsImport } from "./import-actions";

type Preview = Awaited<ReturnType<typeof previewGoodreadsImport>>;

export function GoodreadsImportPanel() {
  const [pending, startTransition] = useTransition();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onFile = (file: File | null) => {
    setPreview(null);
    setResult(null);
    if (!file) {
      setCsv("");
      return;
    }
    void file.text().then((text) => {
      setCsv(text);
      startTransition(async () => {
        setPreview(await previewGoodreadsImport(text));
      });
    });
  };

  const commit = () => {
    if (!csv) return;
    startTransition(async () => {
      const res = await commitGoodreadsImport(csv);
      if ("ok" in res) {
        setResult(`Imported ${res.created} new shelf rows and updated ${res.updated}. Skipped ${res.skipped}.`);
      } else {
        setResult(res.error);
      }
    });
  };

  return (
    <section className="mt-6 min-w-0 overflow-hidden rounded-md bg-mahogany-2 p-4 ring-1 ring-brass/20">
      <div className="font-display text-lg text-parchment">Goodreads import</div>
      <p className="mt-1 max-w-full break-words text-sm leading-relaxed text-parchment-dim" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        Upload your Goodreads CSV export to bring over shelves, ratings, and DNF history.
      </p>

      <label className="tap mt-4 block border border-brass/40 px-3 py-3 font-body uppercase text-brass-bright">
        <span style={{ fontSize: "10px", letterSpacing: "2px" }}>Choose CSV</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {preview && (
        <div className="mt-4 text-sm text-parchment">
          <div>
            {preview.importable} of {preview.total} rows ready, {preview.skipped} skipped before import.
          </div>
          {preview.skippedOverLimit > 0 && (
            <div className="mt-1 text-parchment-dim">
              {preview.skippedOverLimit} more rows are over the 2,000-row import cap.
            </div>
          )}
          <div className="mt-1 break-words text-parchment-dim" style={{ overflowWrap: "anywhere" }}>
            Finished {preview.counts.finished} · Reading {preview.counts.reading} · Pile {preview.counts.pile} · DNF {preview.counts.abandoned}
          </div>
          <button
            type="button"
            disabled={pending || preview.total === 0}
            onClick={commit}
            className="tap mt-3 bg-brass px-4 py-2 font-body uppercase text-mahogany disabled:opacity-60"
            style={{ fontSize: "10px", letterSpacing: "2px" }}
          >
            {pending ? "Importing" : "Import"}
          </button>
        </div>
      )}

      {result && (
        <p className="mt-3 font-caveat text-brass-bright" style={{ fontSize: "15px" }}>{result}</p>
      )}
    </section>
  );
}

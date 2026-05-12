import Link from "next/link";

export default function LicensePage() {
  return (
    <main className="min-h-screen bg-mahogany px-6 py-10 text-parchment">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.35em] text-brass">Marginalia &amp; Co.</p>
          <h1 className="mt-3 font-display text-4xl italic text-parchment">Open Source License</h1>
          <p className="mt-3 text-sm leading-6 text-parchment/70">MIT License</p>
        </div>

        <section className="space-y-3 text-sm leading-7 text-parchment/80">
          <p>
            The source code for Marginalia &amp; Co. is licensed under the MIT License unless a file
            says otherwise.
          </p>
          <p>
            We hope that people who use this project or build on top of it donate a portion of their
            gains to effective charities or local community causes. That is a nonbinding request, not a
            license condition.
          </p>
        </section>

        <pre className="whitespace-pre-wrap border border-brass/20 bg-mahogany-2/70 p-4 text-xs leading-6 text-parchment/80">
{`MIT License

Copyright (c) 2026 Marginalia & Co. contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
        </pre>

        <div className="flex gap-4 border-t border-brass/20 pt-6 text-xs uppercase tracking-[0.22em] text-brass-bright">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </main>
  );
}

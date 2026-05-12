import Link from "next/link";

const updated = "2026-05-12";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-body text-xs uppercase tracking-[0.28em] text-brass-bright">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-parchment/80">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-mahogany px-6 py-10 text-parchment">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.35em] text-brass">Marginalia &amp; Co.</p>
          <h1 className="mt-3 font-display text-4xl italic text-parchment">Terms of Service</h1>
          <p className="mt-3 text-sm leading-6 text-parchment/70">Last updated {updated}</p>
        </div>

        <p className="text-sm leading-7 text-parchment/80">
          These terms are a plain-language agreement for using Marginalia &amp; Co. If you do not agree
          to them, please do not use the app.
        </p>

        <Section title="Using the app">
          <p>
            Marginalia &amp; Co. helps you track books, reading sessions, reviews, ratings, and
            recommendations. You are responsible for the information you add and for keeping your login
            details and API tokens secure.
          </p>
          <p>
            Do not misuse the app, attempt to break into systems, scrape at abusive volume, interfere
            with other users, upload unlawful content, or use the service in a way that violates
            applicable law.
          </p>
        </Section>

        <Section title="Recommendations and book data">
          <p>
            Book metadata, covers, recommendations, and retailer availability may be incomplete,
            delayed, incorrect, or unavailable. Recommendations are for discovery and entertainment,
            not professional advice.
          </p>
        </Section>

        <Section title="Affiliate links">
          <p>
            Some book links may be affiliate links. Marginalia &amp; Co. may earn a small commission at
            no extra cost to you. Affiliate relationships do not guarantee that a retailer has the best
            price, stock, format, delivery terms, or customer service.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You keep ownership of the reviews, notes, ratings, and reading data you add. You give the
            app permission to store, process, display, and back up that content as needed to provide the
            service.
          </p>
          <p>
            If you submit feedback or suggestions, you allow us to use them without owing compensation,
            while you still keep any rights you already had in your own material.
          </p>
        </Section>

        <Section title="Open-source code">
          <p>
            The source code is licensed under the MIT License unless a file says otherwise. The license
            controls what you may do with the code. Separate app names, logos, icons, screenshots, and
            brand assets are not granted as trademarks unless expressly stated.
          </p>
          <p>
            We hope that people who use this project or build on top of it donate a portion of their
            gains to effective charities or local community causes. That request is part of the spirit
            of the project, not a condition of the MIT License.
          </p>
        </Section>

        <Section title="Account changes and termination">
          <p>
            You may stop using the app at any time. We may suspend or remove access if needed to
            protect the service, comply with law, or respond to misuse. We may also change or discontinue
            features.
          </p>
        </Section>

        <Section title="No warranties">
          <p>
            The app is provided as-is and as available. To the extent permitted by law, we disclaim
            warranties of merchantability, fitness for a particular purpose, non-infringement,
            uninterrupted operation, and error-free operation.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the extent permitted by law, Marginalia &amp; Co. and its contributors are not liable for
            indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost
            profits, data loss, or service interruption arising from use of the app.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms as the app changes. The latest version will be posted here with a
            new &quot;Last updated&quot; date.
          </p>
        </Section>

        <div className="flex gap-4 border-t border-brass/20 pt-6 text-xs uppercase tracking-[0.22em] text-brass-bright">
          <Link href="/privacy">Privacy</Link>
          <Link href="/license">License</Link>
        </div>
      </div>
    </main>
  );
}

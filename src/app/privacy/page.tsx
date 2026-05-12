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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-mahogany px-6 py-10 text-parchment">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.35em] text-brass">Marginalia &amp; Co.</p>
          <h1 className="mt-3 font-display text-4xl italic text-parchment">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-6 text-parchment/70">Last updated {updated}</p>
        </div>

        <p className="text-sm leading-7 text-parchment/80">
          Marginalia &amp; Co. is a reading tracker. This policy explains what data the app handles,
          why it is used, and how you can ask for help with it. It is not a promise that every feature
          will always exist exactly as described; the app may change as it develops.
        </p>

        <Section title="Who runs the app">
          <p>
            Marginalia &amp; Co. is operated by the app owner. For privacy requests, use the contact
            method listed on the app store page, project page, or support channel where you received
            access to the app.
          </p>
        </Section>

        <Section title="Data we collect">
          <p>
            We collect the account and reading information you choose to provide, including email
            address, display name, books, reading status, reading sessions, pages, ratings, written
            reviews, API tokens, and app settings.
          </p>
          <p>
            We may process technical information such as device/browser details, authentication
            cookies, request logs, error details, timestamps, and IP-derived security signals to keep
            the service working and prevent abuse.
          </p>
        </Section>

        <Section title="How we use data">
          <p>
            We use your data to provide your shelf, sync across devices, save reviews and ratings,
            power recommendations, maintain API access, debug errors, protect the service, and improve
            the app.
          </p>
          <p>
            Recommendations may use book metadata, your ratings, your shelf, and compact embeddings
            derived from book and preference text. Embeddings are used for matching; they are not sold
            as a profile of you.
          </p>
        </Section>

        <Section title="Service providers">
          <p>
            The app uses service providers for authentication, database hosting, book search, book
            covers, recommendations, and affiliate links. These may include Supabase, Google Books,
            Open Library, OpenAI, and external book retailers or affiliate networks such as Bookshop,
            Shopee, Lazada, Amazon, Kobo/Rakuten, Audible, and Awin.
          </p>
          <p>
            When you follow an external retailer or affiliate link, that third party handles your visit
            under its own terms and privacy policy.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            We use necessary cookies or similar storage for sign-in, security, and app operation. We do
            not currently use advertising cookies inside the app.
          </p>
        </Section>

        <Section title="Retention">
          <p>
            We keep your account and reading data while your account is active or as needed to provide
            the app, comply with legal obligations, resolve disputes, or protect the service. If you ask
            us to delete your account, we will delete or anonymize personal data unless we need to keep
            limited records for legitimate operational or legal reasons.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can update or delete many reading entries in the app. You can request access,
            correction, export, or deletion of your personal data through the support contact. Depending
            on where you live, you may also have rights to object, restrict processing, or complain to a
            privacy regulator.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The app is not intended for children under 13. If you believe a child has provided personal
            data without appropriate consent, contact us so we can review and delete it where required.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use reasonable technical and organizational measures, including managed authentication
            and database access controls. No online service can be guaranteed perfectly secure.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy as the app changes. The latest version will be posted here with
            a new &quot;Last updated&quot; date.
          </p>
        </Section>

        <div className="flex gap-4 border-t border-brass/20 pt-6 text-xs uppercase tracking-[0.22em] text-brass-bright">
          <Link href="/terms">Terms</Link>
          <Link href="/license">License</Link>
        </div>
      </div>
    </main>
  );
}

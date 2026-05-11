export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-mahogany px-6 py-10 text-parchment">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.35em] text-brass">Marginalia &amp; Co.</p>
          <h1 className="mt-3 font-display text-4xl italic text-parchment">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-6 text-parchment/70">Last updated 2026-05-11</p>
        </div>

        <section className="space-y-3 text-sm leading-7 text-parchment/80">
          <p>
            Marginalia &amp; Co. stores the reading data you choose to add, including your shelf, pile,
            reading sessions, ratings, and account details.
          </p>
          <p>
            Authentication and database storage are handled by Supabase. Your shelf is tied to your
            email account so it can travel across your devices.
          </p>
          <p>
            Book search uses third-party book data providers such as Google Books and Open Library.
            Affiliate links may open external retailers such as Shopee.
          </p>
          <p>
            We do not sell personal reading data. Operational logs may be used to keep the app reliable,
            debug errors, and protect against abuse.
          </p>
          <p>
            To request deletion or correction of your data, contact the app owner through the support
            channel listed in the store page.
          </p>
        </section>
      </div>
    </main>
  );
}

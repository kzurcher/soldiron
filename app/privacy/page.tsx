import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Sold Iron
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Privacy Policy</h1>
          </div>
          <Link
            href="/"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12">
        <section className="border border-[var(--line)] bg-[var(--panel)] p-8">
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">How We Handle Data</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-sm leading-7 text-[var(--muted)]">
            <p>
              Sold Iron collects account information, listing details, subscription details, and
              message content needed to operate the marketplace.
            </p>
            <p>
              We use this information to create and manage user accounts, process subscription
              billing, display listings, enable buyer and seller communication, and provide customer
              support.
            </p>
            <p>
              Payment information is processed by third-party payment providers and is not stored
              directly by Sold Iron.
            </p>
            <p>
              We may use service providers such as payment processors, email delivery providers, and
              hosting providers to operate the platform.
            </p>
            <p>
              If you need to update or remove your account information, contact{" "}
              <a href="mailto:kohlzurcher@gmail.com" className="text-[var(--gold)] hover:underline">
                kohlzurcher@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

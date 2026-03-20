import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Sold Iron
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Terms Of Service</h1>
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
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Marketplace Terms</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-sm leading-7 text-[var(--muted)]">
            <p>
              Sold Iron provides an online marketplace for heavy equipment and truck listings.
              Users are responsible for the accuracy of their listings, account details, and any
              communications sent through the platform.
            </p>
            <p>
              Buyers and sellers are responsible for their own negotiations, inspections, payment
              arrangements, and transfer of equipment. Sold Iron does not take possession of listed
              equipment and does not guarantee listing accuracy, condition, or performance.
            </p>
            <p>
              By using the platform, you agree not to submit fraudulent listings, misuse contact
              information, interfere with the site, or use the service for unlawful activity.
            </p>
            <p>
              Sold Iron may suspend accounts or remove listings that violate these terms or create
              risk for the marketplace.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

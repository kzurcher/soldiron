import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Sold Iron
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Contact</h1>
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
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Customer Support</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-[var(--muted)]">
            <p>
              Sold Iron supports buyers and sellers who use the marketplace to browse listings,
              post heavy equipment, and communicate directly about available inventory.
            </p>
            <p>
              For account questions, subscription issues, listing support, or transaction-related
              concerns, contact us at{" "}
              <a
                href="mailto:soldironmarketplace@gmail.com"
                className="text-[var(--gold)] hover:underline"
              >
                soldironmarketplace@gmail.com
              </a>
              .
            </p>
            <p>
              We aim to respond to customer inquiries within 1 to 2 business days.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

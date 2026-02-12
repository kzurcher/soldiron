import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Sold Iron
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">About</h1>
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
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Our Story</h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-[var(--muted)]">
            <p>
              With over 10 years in the industry, whether it be operating, buying, selling, or
              just looking at what is out there, we felt there was a void in the market.
            </p>
            <p>
              So we started Sold Iron, the premier marketplace for heavy equipment and heavy
              trucks.
            </p>
            <p>
              We strive to create and curate the best buying and selling experience for anyone from
              an owner operator to full-blown dealers.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

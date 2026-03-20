import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Sold Iron
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">
              Refund And Cancellation Policy
            </h1>
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
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Subscriptions</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-sm leading-7 text-[var(--muted)]">
            <p>
              Sold Iron subscriptions provide access to marketplace posting and browsing features.
              Subscription fees are billed in advance on a monthly or yearly basis, depending on the
              plan selected at checkout.
            </p>
            <p>
              You may cancel future renewals at any time before the next billing cycle. Unless
              otherwise required by law, payments already processed for the current billing period
              are non-refundable.
            </p>
            <p>
              If you believe you were charged in error, contact{" "}
              <a
                href="mailto:soldironmarketplace@gmail.com"
                className="text-[var(--gold)] hover:underline"
              >
                soldironmarketplace@gmail.com
              </a>
              {" "}for review.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

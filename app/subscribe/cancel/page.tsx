import Link from "next/link";

export default function SubscribeCancelPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
        <section className="w-full border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-[var(--gold)]">Checkout Canceled</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            No charge was made. You can restart whenever you are ready.
          </p>
          <div className="mt-6">
            <Link
              href="/subscribe"
              className="border border-[var(--line-strong)] bg-[var(--gold)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-black"
            >
              Try Again
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

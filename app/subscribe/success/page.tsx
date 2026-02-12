import Link from "next/link";

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
        <section className="w-full border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-[var(--gold)]">Subscription Active</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Your billing setup is complete. You can now create listings.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/list-machine"
              className="border border-[var(--line-strong)] bg-[var(--gold)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-black"
            >
              Post Listing
            </Link>
            <Link
              href="/"
              className="border border-[var(--line)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
            >
              Back Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

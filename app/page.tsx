import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0 overflow-hidden bg-[var(--panel)] p-1">
              <Image
                src="/sold-iron-logo.png"
                alt="Sold Iron logo"
                width={300}
                height={200}
                className="h-auto w-[220px] object-contain sm:w-[300px] lg:w-[360px]"
                priority
              />
            </div>
            <div>
              <p className="font-display text-3xl leading-none text-[var(--gold)] sm:text-4xl">
                Sold Iron
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text)] sm:text-base">
                Heavy Equipment Marketplace
              </p>
            </div>
          </div>
          <nav className="hidden w-[620px] items-center justify-between text-sm font-semibold uppercase tracking-[0.12em] md:flex">
            <Link href="/subscribe" className="text-[var(--muted)] transition hover:text-[var(--gold)]">
              Post Listing
            </Link>
            <Link href="/listings" className="text-[var(--muted)] transition hover:text-[var(--gold)]">
              Browse All Equipment
            </Link>
            <Link href="/subscribe" className="text-[var(--muted)] transition hover:text-[var(--gold)]">
              Sign Up
            </Link>
            <Link href="/about" className="text-[var(--muted)] transition hover:text-[var(--gold)]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section id="market" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
              Buy and sell equipment
              <span className="block text-[var(--gold)]">without the auction noise.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)]">
              A contractor-first marketplace with verified sellers, transparent machine history,
              and direct buyer access to serious inventory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/listings"
                className="border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
              >
                Browse Equipment
              </Link>
              <Link
                href="/subscribe"
                className="border border-[var(--line)] bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
              >
                Post Listing
              </Link>
            </div>
          </div>

          <div className="border border-[var(--line)] bg-[var(--panel)] p-6 shadow-industrial">
            <h2 className="font-display text-2xl uppercase">Quick Search</h2>
            <form className="mt-5 grid gap-3">
              <input
                type="text"
                placeholder="Category (Excavator, Dozer, Loader)"
                className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
              />
              <input
                type="text"
                placeholder="Make or Model"
                className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Location"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Max Budget"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
              </div>
              <button
                type="submit"
                className="mt-2 h-11 border border-[var(--line-strong)] bg-[var(--gold)] text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
              >
                Find Inventory
              </button>
            </form>
          </div>
        </section>

        <section id="sellers" className="border-t border-[var(--line)] bg-black/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-3">
            <article>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Step 1</p>
              <h4 className="mt-2 text-xl font-semibold uppercase">Source Clean Equipment</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Filter for year, hours, and geography to find high-fit inventory faster.
              </p>
            </article>
            <article>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Step 2</p>
              <h4 className="mt-2 text-xl font-semibold uppercase">Verify Before Contact</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Review machine history, service records, and seller credentials up front.
              </p>
            </article>
            <article>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Step 3</p>
              <h4 className="mt-2 text-xl font-semibold uppercase">Close Strong Deals</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Move equipment with less friction using a marketplace built for serious buyers.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

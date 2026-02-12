import Link from "next/link";

export default function ListAttachmentPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Seller Intake
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">List Attachment</h1>
          </div>
          <Link
            href="/"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Submit your attachment details below. This intake captures the core information needed
            to publish your listing.
          </p>

          <form className="mt-8 grid gap-8">
            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">Attachment Details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Attachment Type (Bucket, Forks, Grapple)"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Brand / Manufacturer"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Model"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="number"
                  placeholder="Year"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Compatible Machines"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Location (City, State)"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">Condition And Price</h2>
              <div className="mt-4 grid gap-3">
                <input
                  type="text"
                  placeholder="Asking Price"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <textarea
                  placeholder="Condition details, wear level, included hardware, and notes."
                  rows={5}
                  className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <div className="grid gap-2">
                  <label
                    htmlFor="attachment-photos"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                  >
                    Upload Photos
                  </label>
                  <input
                    id="attachment-photos"
                    name="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    className="block w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm file:mr-4 file:border-0 file:bg-[var(--gold)] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.1em] file:text-black"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">Seller Contact</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
              <button
                type="submit"
                className="border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
              >
                Submit Attachment Listing
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

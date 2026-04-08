import Link from "next/link";
import { getSessionFromCookies } from "@/lib/session";
import { getSubscriptionByEmail } from "@/lib/subscription-store";
import { getUserProfileByEmail } from "@/lib/user-profile-store";
import ListMachineClient from "./ListMachineClient";

const initialState = {
  listingType: "equipment" as const,
  category: "dozer" as const,
  make: "",
  model: "",
  year: "",
  operatingHours: "",
  serialNumber: "",
  location: "",
  latitude: "",
  longitude: "",
  askingPrice: "",
  description: "",
  fullName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
};

export const dynamic = "force-dynamic";

export default async function ListMachinePage() {
  const session = await getSessionFromCookies();
  const email = session?.email ?? "";
  const subscription = email ? await getSubscriptionByEmail(email) : null;
  const profile = email ? await getUserProfileByEmail(email) : null;
  const hasAccess = subscription?.status === "active";

  const initialForm = {
    ...initialState,
    email,
    fullName: profile?.fullName ?? session?.fullName ?? "",
    phoneNumber: profile?.phoneNumber ?? session?.phoneNumber ?? "",
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Seller Intake
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Post Listing</h1>
          </div>
          <Link
            href="/"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back To Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        {!hasAccess ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-6 text-center sm:p-8">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">
              Subscription Required
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              You need an active subscription before posting listings.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-in"
                className="inline-block border border-[var(--line)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
              >
                Sign In
              </Link>
              <Link
                href="/subscribe"
                className="inline-block border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
              >
                Sign Up
              </Link>
            </div>
          </section>
        ) : (
          <ListMachineClient initialForm={initialForm} />
        )}
      </main>
    </div>
  );
}

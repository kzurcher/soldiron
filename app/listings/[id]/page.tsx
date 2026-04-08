"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ListingRecord = {
  id: string;
  listingType?: string;
  category?: string;
  email?: string;
  make: string;
  model: string;
  year: string;
  operatingHours: string;
  serialNumber?: string;
  location: string;
  askingPrice: string;
  description: string;
  photoPaths?: string[];
  fullName?: string;
  companyName?: string;
  phoneNumber?: string;
};

function formatCategory(category?: string, listingType?: string): string {
  const resolved = category ?? (listingType === "truck" ? "truck" : "compact-equipment");
  switch (resolved) {
    case "dozer":
      return "Dozer";
    case "excavator":
      return "Excavator";
    case "compact-equipment":
      return "Compact Equipment";
    case "truck":
      return "Truck";
    default:
      return "Equipment";
  }
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params?.id ?? "";
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState({
    senderName: "",
    senderPhone: "",
    senderEmail: "",
  });
  const [messageForm, setMessageForm] = useState({
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");

  useEffect(() => {
    async function hydrateProfile() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        const result = (await response.json()) as {
          authenticated?: boolean;
          session?: { fullName?: string; phoneNumber?: string; email?: string };
        };
        if (response.ok && result.authenticated && result.session) {
          setBuyerProfile({
            senderName: result.session.fullName ?? "",
            senderPhone: result.session.phoneNumber ?? "",
            senderEmail: result.session.email ?? "",
          });
          return;
        }
      } catch {
        // Ignore and show empty identity until session resolves.
      }

      setBuyerProfile({
        senderName: "",
        senderPhone: "",
        senderEmail: "",
      });
    }

    void hydrateProfile();
  }, []);

  useEffect(() => {
    if (!listingId) return;

    async function verifyAndLoadListing() {
      try {
        const statusResponse = await fetch("/api/billing/status", { cache: "no-store" });
        const statusResult = (await statusResponse.json()) as { ok: boolean; active?: boolean };
        if (!statusResponse.ok || !statusResult.ok || !statusResult.active) {
          setHasAccess(false);
          setAccessChecked(true);
          setLoading(false);
          return;
        }

        setHasAccess(true);
        setAccessChecked(true);
      } catch {
        setHasAccess(false);
        setAccessChecked(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/listings/${listingId}`);
        const result = (await response.json()) as {
          ok: boolean;
          listing?: ListingRecord;
          error?: string;
        };

        if (!response.ok || !result.ok || !result.listing) {
          setLoadError(result.error ?? "Could not load listing.");
          return;
        }

        setListing(result.listing);
      } catch {
        setLoadError("Could not load listing.");
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoadListing();
  }, [listingId]);

  async function sendMessage() {
    if (!listing) return;
    if (!listing.email) {
      setMessageStatus("Seller email is not available for this listing.");
      return;
    }
    if (!buyerProfile.senderName || !buyerProfile.senderPhone || !buyerProfile.senderEmail) {
      setMessageStatus(
        "Account details missing. Go to Sign Up and save your name, phone, and email first."
      );
      return;
    }

    setSending(true);
    setMessageStatus("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          listingTitle: `${listing.make} ${listing.model} ${listing.year ? `(${listing.year})` : ""}`.trim(),
          sellerName: listing.fullName ?? "",
          sellerEmail: listing.email,
          message: messageForm.message,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        emailStatus?: "sent" | "skipped" | "failed";
      };

      if (!response.ok || !result.ok) {
        setMessageStatus(result.error ?? "Could not send message.");
        return;
      }

      setMessageStatus(
        result.emailStatus === "sent"
          ? "Message sent. Seller was also notified by email."
          : "Message sent on-site."
      );
      setMessageForm((prev) => ({ ...prev, message: "" }));
    } catch {
      setMessageStatus("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Listing Detail
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Equipment Listing</h1>
          </div>
          <Link
            href="/listings"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back To Listings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        {accessChecked && !hasAccess ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">
              Subscription Required
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              An active subscription is required to browse equipment listings.
            </p>
            <Link
              href="/subscribe"
              className="mt-6 inline-block border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110"
            >
              Sign Up
            </Link>
          </section>
        ) : loading ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-[var(--muted)]">Loading listing...</p>
          </section>
        ) : loadError || !listing ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-red-400">{loadError || "Listing not found."}</p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="relative mb-4 h-64 w-full overflow-hidden border border-[var(--line)] bg-[var(--panel-soft)] sm:h-80">
                {listing.photoPaths && listing.photoPaths.length > 0 ? (
                  <Image
                    src={listing.photoPaths[0]}
                    alt={`${listing.make} ${listing.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    No Photo Uploaded
                  </div>
                )}
              </div>

              {listing.photoPaths && listing.photoPaths.length > 1 && (
                <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {listing.photoPaths.slice(1).map((path, index) => (
                    <div
                      key={`${path}-${index}`}
                      className="relative h-20 overflow-hidden border border-[var(--line)] bg-[var(--panel-soft)]"
                    >
                      <Image
                        src={path}
                        alt={`${listing.make} ${listing.model} photo ${index + 2}`}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                {formatCategory(listing.category, listing.listingType)}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                {listing.make} {listing.model} {listing.year ? `(${listing.year})` : ""}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{listing.location}</p>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{listing.description}</p>

              <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
                <p className="font-display text-3xl text-[var(--gold)]">{listing.askingPrice || "TBD"}</p>
                <p className="text-sm uppercase tracking-[0.1em] text-[var(--muted)] sm:text-right">
                  {listing.operatingHours
                    ? listing.listingType === "truck"
                      ? `${listing.operatingHours} miles`
                      : `${listing.operatingHours} hrs`
                    : listing.listingType === "truck"
                      ? "Miles N/A"
                      : "Hours N/A"}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Serial:</span>{" "}
                  {listing.serialNumber || "Not listed"}
                </p>
                <p className="text-sm text-[var(--muted)] sm:text-right">
                  <span className="font-semibold text-[var(--text)]">Seller:</span>{" "}
                  {listing.fullName || "Not listed"}
                </p>
              </div>
            </article>

            <aside className="border border-[var(--line)] bg-[var(--panel)] p-5">
              <h3 className="font-display text-2xl uppercase text-[var(--gold)]">Message Seller</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Send your interest directly from this listing page.
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Sending as {buyerProfile.senderName || "Unknown"} |{" "}
                {buyerProfile.senderPhone || "No phone"} | {buyerProfile.senderEmail || "No email"}
              </p>

              <div className="mt-4 grid gap-2">
                <textarea
                  rows={5}
                  placeholder="Write your message to the seller..."
                  value={messageForm.message}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--line-strong)]"
                />
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendMessage()}
                  className="h-10 border border-[var(--line-strong)] bg-[var(--gold)] px-4 text-xs font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
                {messageStatus && <p className="text-xs text-[var(--gold)]">{messageStatus}</p>}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

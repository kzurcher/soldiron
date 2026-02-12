"use client";

import Link from "next/link";
import { useState } from "react";

type ListingFormState = {
  listingType: "equipment" | "attachment" | "truck";
  make: string;
  model: string;
  year: string;
  operatingHours: string;
  serialNumber: string;
  location: string;
  latitude: string;
  longitude: string;
  askingPrice: string;
  description: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
};

const initialState: ListingFormState = {
  listingType: "equipment",
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

const inputClassName =
  "h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]";

export default function ListMachinePage() {
  const [form, setForm] = useState<ListingFormState>(initialState);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  function updateField(field: keyof ListingFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const payload = new FormData();
      payload.append("make", form.make);
      payload.append("listingType", form.listingType);
      payload.append("model", form.model);
      payload.append("year", form.year);
      payload.append("operatingHours", form.operatingHours);
      payload.append("serialNumber", form.serialNumber);
      payload.append("location", form.location);
      payload.append("latitude", form.latitude);
      payload.append("longitude", form.longitude);
      payload.append("askingPrice", form.askingPrice);
      payload.append("description", form.description);
      payload.append("fullName", form.fullName);
      payload.append("companyName", form.companyName);
      payload.append("email", form.email);
      payload.append("phoneNumber", form.phoneNumber);
      photos.forEach((file) => payload.append("photos", file));

      const response = await fetch("/api/list-machine", {
        method: "POST",
        body: payload,
      });

      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setStatus({
          type: "error",
          message:
            result.error ??
            "Could not submit your listing request. Ensure your subscription is active.",
        });
        return;
      }

      setForm(initialState);
      setPhotos([]);
      setStatus({
        type: "success",
        message: "Listing posted successfully.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error while submitting. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus({ type: "error", message: "Geolocation is not supported in this browser." });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setStatus({ type: "success", message: "Current location added to this listing." });
        setLocating(false);
      },
      () => {
        setStatus({ type: "error", message: "Could not access your location." });
        setLocating(false);
      }
    );
  }

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
        <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Start your listing submission below. This captures seller and machine details so we can
            publish a complete, high-confidence listing. Active subscription required.{" "}
            <Link href="/subscribe" className="text-[var(--gold)] hover:underline">
              Subscribe here
            </Link>
            .
          </p>

          <form className="mt-8 grid gap-8" onSubmit={onSubmit}>
            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">Machine Details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={form.listingType}
                  onChange={(e) =>
                    updateField("listingType", e.target.value as ListingFormState["listingType"])
                  }
                  className={inputClassName}
                >
                  <option value="equipment">List Equipment</option>
                  <option value="attachment">List Attachments</option>
                  <option value="truck">List A Truck</option>
                </select>
                <input
                  type="text"
                  placeholder="Make (e.g. Caterpillar)"
                  value={form.make}
                  onChange={(e) => updateField("make", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="text"
                  placeholder="Model (e.g. 336)"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => updateField("year", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="number"
                  placeholder="Operating Hours"
                  value={form.operatingHours}
                  onChange={(e) => updateField("operatingHours", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="text"
                  placeholder="Serial Number"
                  value={form.serialNumber}
                  onChange={(e) => updateField("serialNumber", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="text"
                  placeholder="Location (City, State)"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="h-11 border border-[var(--line)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {locating ? "Locating..." : "Use Current Location"}
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">
                Listing And Condition
              </h2>
              <div className="mt-4 grid gap-3">
                <input
                  type="text"
                  placeholder="Asking Price"
                  value={form.askingPrice}
                  onChange={(e) => updateField("askingPrice", e.target.value)}
                  className={inputClassName}
                />
                <textarea
                  placeholder="Description: service history, attachments, known issues, and condition notes."
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <div className="grid gap-2">
                  <label
                    htmlFor="photos"
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                  >
                    Upload Photos
                  </label>
                  <input
                    id="photos"
                    name="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                    className="block w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm file:mr-4 file:border-0 file:bg-[var(--gold)] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.1em] file:text-black"
                  />
                  {photos.length > 0 && (
                    <p className="text-xs text-[var(--gold)]">
                      {photos.length} photo{photos.length === 1 ? "" : "s"} selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl uppercase text-[var(--gold)]">Seller Contact</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClassName}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="border border-[var(--line-strong)] bg-[var(--gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Posting..." : "Create Listing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(initialState);
                  setPhotos([]);
                  setStatus({ type: "idle", message: "" });
                }}
                className="border border-[var(--line)] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
              >
                Clear Form
              </button>
            </div>

            {status.type !== "idle" && (
              <p
                className={`text-sm ${
                  status.type === "success" ? "text-[var(--gold)]" : "text-red-400"
                }`}
              >
                {status.message}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

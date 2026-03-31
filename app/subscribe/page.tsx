"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubscribePage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function hydrateProfile() {
      try {
        const sessionResponse = await fetch("/api/session");
        const sessionResult = (await sessionResponse.json()) as {
          ok?: boolean;
          authenticated?: boolean;
          session?: { email?: string; fullName?: string; phoneNumber?: string };
        };
        if (sessionResponse.ok && sessionResult.authenticated && sessionResult.session) {
          setFullName(sessionResult.session.fullName ?? "");
          setPhoneNumber(sessionResult.session.phoneNumber ?? "");
          setEmail(sessionResult.session.email ?? "");
          return;
        }
      } catch {
        // Fall back to local browser draft values.
      }

      try {
        const raw = localStorage.getItem("soldiron_user_profile");
        if (!raw) return;
        const profile = JSON.parse(raw) as { fullName?: string; phoneNumber?: string; email?: string };
        setFullName(profile.fullName ?? "");
        setPhoneNumber(profile.phoneNumber ?? "");
        setEmail(profile.email ?? "");
      } catch {
        // Ignore malformed local profile.
      }
    }

    void hydrateProfile();
  }, []);

  async function onSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      localStorage.setItem(
        "soldiron_user_profile",
        JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: normalizedEmail,
        })
      );

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          plan,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };
      if (!response.ok || !result.ok || !result.url) {
        setError(result.error ?? "Could not start checkout.");
        return;
      }

      setMessage("Redirecting to secure checkout...");
      window.location.href = result.url;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Post Listing
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Choose Your Plan</h1>
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
        <section className="border border-[var(--line)] bg-[var(--panel)] p-8">
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Sold Iron Pro</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            We are excited to get your equipment sold. Please choose a plan to begin posting or
            browsing.
          </p>

          <form className="mt-6 grid max-w-xl gap-3" onSubmit={onSubscribe}>
            <div className="border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
                Account Info
              </p>
              <div className="mt-3 grid gap-3">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-11 border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="h-11 border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email used for your account"
                  className="h-11 border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
                />
              </div>
            </div>

            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as "monthly" | "yearly")}
              className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition focus:border-[var(--line-strong)]"
            >
              <option value="monthly">Monthly Plan - $15.00/month</option>
              <option value="yearly">Yearly Plan - $160.00/Yearly</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="h-11 border border-[var(--line-strong)] bg-[var(--gold)] text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Starting Checkout..." : "Start Subscription"}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[var(--gold)]">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </section>
      </main>
    </div>
  );
}

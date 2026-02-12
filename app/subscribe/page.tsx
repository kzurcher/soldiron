"use client";

import Link from "next/link";
import { useState } from "react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
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
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as "monthly" | "yearly")}
              className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition focus:border-[var(--line-strong)]"
            >
              <option value="monthly">Monthly Plan - $15.00/month</option>
              <option value="yearly">Yearly Plan - $160.00/Yearly</option>
            </select>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email used for your seller account"
              className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
            />
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

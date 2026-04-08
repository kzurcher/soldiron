"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        active?: boolean;
        session?: { email?: string; fullName?: string; phoneNumber?: string };
      };

      if (!response.ok || !result.ok) {
        setStatus(result.error ?? "Could not sign in.");
        return;
      }

      if (result.session?.email) {
        localStorage.setItem(
          "soldiron_user_profile",
          JSON.stringify({
            email: result.session.email,
            fullName: result.session.fullName ?? "",
            phoneNumber: result.session.phoneNumber ?? "",
          })
        );
      }

      setStatus(
        result.active
          ? "Signed in. Redirecting you to post your listing."
          : "Signed in. Your account is recognized, but your subscription is not active yet."
      );

      window.setTimeout(() => {
        window.location.href = result.active ? "/list-machine" : "/subscribe";
      }, 800);
    } catch {
      setStatus("Could not sign in.");
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
              Account Access
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Sign In</h1>
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
        <section className="max-w-xl border border-[var(--line)] bg-[var(--panel)] p-8">
          <h2 className="font-display text-4xl uppercase text-[var(--gold)]">Welcome Back</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Use the same email tied to your Sold Iron subscription and we will restore your account
            session.
          </p>

          <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email used for your subscription"
              className="h-11 border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-[var(--line-strong)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 border border-[var(--line-strong)] bg-[var(--gold)] text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {status && <p className="mt-4 text-sm text-[var(--gold)]">{status}</p>}

          <p className="mt-6 text-sm text-[var(--muted)]">
            New seller?{" "}
            <Link href="/subscribe" className="text-[var(--gold)] hover:underline">
              Choose a plan
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

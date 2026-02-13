"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubscribeSuccessPage() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    async function confirmSession() {
      const url = new URL(window.location.href);
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/billing/confirm-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        setStatus(response.ok ? "ok" : "error");
      } catch {
        setStatus("error");
      }
    }

    void confirmSession();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
        <section className="w-full border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-[var(--gold)]">Subscription Active</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {status === "ok"
              ? "Your billing setup is complete. You can now create listings."
              : status === "error"
                ? "Subscription succeeded, but final confirmation is pending. Try posting now or refresh."
                : "Finalizing your subscription..."}
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

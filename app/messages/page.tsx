"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MessageRecord = {
  id: string;
  listingId: string;
  listingTitle: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
  createdAt: string;
  replies?: Array<{
    id: string;
    sellerEmail: string;
    reply: string;
    createdAt: string;
  }>;
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");

  async function loadMessages() {
    const response = await fetch("/api/messages");
    const result = (await response.json()) as { ok: boolean; messages: MessageRecord[] };
    if (!response.ok || !result.ok) {
      throw new Error("Could not load your messages right now.");
    }
    setMessages(result.messages ?? []);
  }

  useEffect(() => {
    async function verifyAndLoadMessages() {
      try {
        const statusResponse = await fetch("/api/billing/status");
        const statusResult = (await statusResponse.json()) as {
          ok: boolean;
          active?: boolean;
          session?: { email?: string };
        };
        if (!statusResponse.ok || !statusResult.ok || !statusResult.active) {
          setHasAccess(false);
          setAccessChecked(true);
          setLoading(false);
          return;
        }

        setSubscriberEmail(statusResult.session?.email ?? "");
        setHasAccess(true);
        setAccessChecked(true);
      } catch {
        setHasAccess(false);
        setAccessChecked(true);
        setLoading(false);
        return;
      }

      try {
        await loadMessages();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load your messages right now.";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoadMessages();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Seller Inbox
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Messages</h1>
          </div>
          <Link
            href="/"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back Home
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
              An active subscription is required to view seller messages.
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
            <p className="text-sm text-[var(--muted)]">Loading messages...</p>
          </section>
        ) : loadError ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-red-400">{loadError}</p>
          </section>
        ) : messages.length === 0 ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">No Messages Yet</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Messages sent to {subscriberEmail || "your account"} will show up here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/messages/${message.id}`}
                className="block border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:border-[var(--line-strong)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                      Listing Message
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">{message.listingTitle || "Listing"}</h2>
                  </div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                    {formatDate(message.createdAt)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)] sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[var(--text)]">From:</span> {message.senderName}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--text)]">Phone:</span> {message.senderPhone}
                  </p>
                </div>

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{message.message}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]/80">
                  Tap to open thread
                </p>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingFor, setReplyingFor] = useState<string | null>(null);
  const [replyStatusByMessage, setReplyStatusByMessage] = useState<Record<string, string>>({});

  async function loadMessages(email: string) {
    const response = await fetch(`/api/messages?email=${encodeURIComponent(email)}`);
    const result = (await response.json()) as { ok: boolean; messages: MessageRecord[] };
    if (!response.ok || !result.ok) {
      throw new Error("Could not load your messages right now.");
    }
    setMessages(result.messages ?? []);
  }

  useEffect(() => {
    async function verifyAndLoadMessages() {
      const email = (localStorage.getItem("soldiron_subscriber_email") ?? "").toLowerCase();
      setSubscriberEmail(email);

      if (!email) {
        setHasAccess(false);
        setAccessChecked(true);
        setLoading(false);
        return;
      }

      try {
        const statusResponse = await fetch(`/api/billing/status?email=${encodeURIComponent(email)}`);
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
        await loadMessages(email);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load your messages right now.";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoadMessages();
  }, []);

  async function sendReply(message: MessageRecord) {
    const draft = (replyDrafts[message.id] ?? "").trim();
    if (!draft) {
      setReplyStatusByMessage((prev) => ({ ...prev, [message.id]: "Reply is required." }));
      return;
    }
    if (!subscriberEmail) {
      setReplyStatusByMessage((prev) => ({ ...prev, [message.id]: "Seller account email is missing." }));
      return;
    }

    setReplyingFor(message.id);
    setReplyStatusByMessage((prev) => ({ ...prev, [message.id]: "" }));

    try {
      const response = await fetch(`/api/messages/${message.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerEmail: subscriberEmail,
          reply: draft,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        buyerEmailStatus?: "sent" | "skipped" | "failed";
      };

      if (!response.ok || !result.ok) {
        setReplyStatusByMessage((prev) => ({ ...prev, [message.id]: result.error ?? "Could not send reply." }));
        return;
      }

      setReplyDrafts((prev) => ({ ...prev, [message.id]: "" }));
      setReplyStatusByMessage((prev) => ({
        ...prev,
        [message.id]:
          result.buyerEmailStatus === "sent"
            ? "Reply saved and buyer was notified by email."
            : "Reply saved on-site.",
      }));
      await loadMessages(subscriberEmail);
    } catch {
      setReplyStatusByMessage((prev) => ({ ...prev, [message.id]: "Could not send reply." }));
    } finally {
      setReplyingFor(null);
    }
  }

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
              <article key={message.id} className="border border-[var(--line)] bg-[var(--panel)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                      Listing Message
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {message.listingTitle || "Listing"}
                    </h2>
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
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-[var(--text)]">Email:</span>{" "}
                    {message.senderEmail || "Not provided"}
                  </p>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                  {message.message}
                </p>

                {message.replies && message.replies.length > 0 && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                      Replies
                    </p>
                    <div className="mt-3 grid gap-3">
                      {message.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2"
                        >
                          <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                            Seller Reply • {formatDate(reply.createdAt)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                            {reply.reply}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  <textarea
                    rows={3}
                    placeholder="Reply to this buyer..."
                    value={replyDrafts[message.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [message.id]: e.target.value,
                      }))
                    }
                    className="w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--line-strong)]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={replyingFor === message.id}
                      onClick={() => void sendReply(message)}
                      className="h-10 border border-[var(--line-strong)] bg-[var(--gold)] px-4 text-xs font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {replyingFor === message.id ? "Sending..." : "Send Reply"}
                    </button>
                    {replyStatusByMessage[message.id] && (
                      <p className="text-xs text-[var(--gold)]">{replyStatusByMessage[message.id]}</p>
                    )}
                  </div>

                  <Link
                    href={`/listings/${message.listingId}`}
                    className="mt-3 inline-block border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
                  >
                    Open Listing
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

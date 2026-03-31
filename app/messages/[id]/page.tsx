"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function MessageThreadPage() {
  const params = useParams<{ id: string }>();
  const messageId = params?.id ?? "";

  const [thread, setThread] = useState<MessageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");

  async function loadThread(id: string) {
    const response = await fetch(`/api/messages/${id}`);
    const result = (await response.json()) as {
      ok: boolean;
      message?: MessageRecord;
      error?: string;
    };
    if (!response.ok || !result.ok || !result.message) {
      throw new Error(result.error ?? "Could not load this message thread.");
    }
    setThread(result.message);
  }

  useEffect(() => {
    if (!messageId) return;

    async function verifyAndLoadThread() {
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
        await loadThread(messageId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load this message thread.";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoadThread();
  }, [messageId]);

  async function sendReply() {
    const draft = replyDraft.trim();
    if (!draft) {
      setReplyStatus("Reply is required.");
      return;
    }
    if (!subscriberEmail) {
      setReplyStatus("Seller account email is missing.");
      return;
    }
    if (!thread) return;

    setReplying(true);
    setReplyStatus("");
    try {
      const response = await fetch(`/api/messages/${thread.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: draft,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        buyerEmailStatus?: "sent" | "skipped" | "failed";
      };

      if (!response.ok || !result.ok) {
        setReplyStatus(result.error ?? "Could not send reply.");
        return;
      }

      setReplyDraft("");
      setReplyStatus(
        result.buyerEmailStatus === "sent"
          ? "Reply sent and buyer notified by email."
          : "Reply sent on-site."
      );
      await loadThread(thread.id);
    } catch {
      setReplyStatus("Could not send reply.");
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Message Thread
            </p>
            <h1 className="font-display text-3xl uppercase sm:text-4xl">Conversation</h1>
          </div>
          <Link
            href="/messages"
            className="border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
          >
            Back To Messages
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        {accessChecked && !hasAccess ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <h2 className="font-display text-3xl uppercase text-[var(--gold)]">
              Subscription Required
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              An active subscription is required to view message threads.
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
            <p className="text-sm text-[var(--muted)]">Loading thread...</p>
          </section>
        ) : loadError || !thread ? (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
            <p className="text-sm text-red-400">{loadError || "Message thread not found."}</p>
          </section>
        ) : (
          <section className="border border-[var(--line)] bg-[var(--panel)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Listing Message
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{thread.listingTitle || "Listing"}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
              {formatDate(thread.createdAt)}
            </p>

            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <div className="rounded border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  Buyer Message | {thread.senderName} | {thread.senderPhone}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                  {thread.message}
                </p>
              </div>

              {thread.replies && thread.replies.length > 0 && (
                <div className="mt-3 grid gap-3">
                  {thread.replies
                    .slice()
                    .reverse()
                    .map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded border border-[var(--line)] bg-[var(--bg)] px-3 py-3"
                      >
                        <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                          Seller Reply | {formatDate(reply.createdAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                          {reply.reply}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <textarea
                rows={4}
                placeholder="Reply to this buyer..."
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                className="w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--line-strong)]"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={replying}
                  onClick={() => void sendReply()}
                  className="h-10 border border-[var(--line-strong)] bg-[var(--gold)] px-4 text-xs font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {replying ? "Sending..." : "Send Reply"}
                </button>
                {replyStatus && <p className="text-xs text-[var(--gold)]">{replyStatus}</p>}
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <Link
                href={`/listings/${thread.listingId}`}
                className="inline-block border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--gold)]"
              >
                Open Listing
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

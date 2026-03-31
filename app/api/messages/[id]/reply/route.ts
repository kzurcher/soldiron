import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmailNotification } from "@/lib/email";
import { saveMessageReply } from "@/lib/message-store";
import { getSessionFromCookies } from "@/lib/session";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

type ReplyRequest = {
  sellerEmail?: string;
  reply?: string;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ReplyRequest;
    const session = await getSessionFromCookies();
    const sellerEmail = clean(session?.email).toLowerCase();
    const reply = clean(body.reply);

    if (!id) return NextResponse.json({ ok: false, error: "Message id is required." }, { status: 400 });
    if (!sellerEmail) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!reply) return NextResponse.json({ ok: false, error: "Reply is required." }, { status: 400 });

    const subscription = await getSubscriptionByEmail(sellerEmail);
    if (subscription?.status !== "active") {
      return NextResponse.json({ ok: false, error: "Active subscription required." }, { status: 402 });
    }

    const result = await saveMessageReply({
      messageId: id,
      sellerEmail,
      reply,
    });

    if (!result.ok) {
      if (result.error === "message_not_found") {
        return NextResponse.json({ ok: false, error: "Message not found." }, { status: 404 });
      }
      if (result.error === "forbidden") {
        return NextResponse.json({ ok: false, error: "You do not have access to this message." }, { status: 403 });
      }
      return NextResponse.json({ ok: false, error: "Could not save reply." }, { status: 400 });
    }

    let buyerEmailStatus: "sent" | "skipped" | "failed" = "skipped";
    let buyerEmailError: string | undefined;
    if (isEmailConfigured() && result.message?.senderEmail) {
      const subject = `Sold Iron: Seller reply on ${result.message.listingTitle || "your listing inquiry"}`;
      const text =
        `You received a seller reply on Sold Iron.\n\n` +
        `Listing: ${result.message.listingTitle || result.message.listingId}\n` +
        `Seller: ${result.message.sellerName || result.message.sellerEmail}\n\n` +
        `Reply:\n${reply}`;
      const email = await sendEmailNotification({
        to: result.message.senderEmail,
        subject,
        text,
      });
      buyerEmailStatus = email.ok ? "sent" : "failed";
      buyerEmailError = email.error;
    }

    return NextResponse.json(
      { ok: true, reply: result.reply, buyerEmailStatus, buyerEmailError },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json(
      { ok: false, error: "Failed to send reply.", debug: { message } },
      { status: 500 }
    );
  }
}

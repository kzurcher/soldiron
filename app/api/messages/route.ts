import { NextResponse } from "next/server";
import { getMessagesForSeller, saveMessage } from "@/lib/message-store";
import { isEmailConfigured, sendEmailNotification } from "@/lib/email";

type MessageRequest = {
  listingId?: string;
  listingTitle?: string;
  sellerName?: string;
  sellerEmail?: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  message?: string;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerEmail = clean(searchParams.get("email") ?? undefined).toLowerCase();
    if (!sellerEmail) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const messages = await getMessagesForSeller(sellerEmail);
    return NextResponse.json({ ok: true, messages });
  } catch {
    return NextResponse.json({ ok: false, messages: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessageRequest;
    const payload = {
      listingId: clean(body.listingId),
      listingTitle: clean(body.listingTitle),
      sellerName: clean(body.sellerName),
      sellerEmail: clean(body.sellerEmail).toLowerCase(),
      senderName: clean(body.senderName),
      senderPhone: clean(body.senderPhone),
      senderEmail: clean(body.senderEmail).toLowerCase(),
      message: clean(body.message),
    };

    if (!payload.listingId) return NextResponse.json({ ok: false, error: "Listing id is required." }, { status: 400 });
    if (!payload.sellerEmail) return NextResponse.json({ ok: false, error: "Seller email is required." }, { status: 400 });
    if (!payload.senderName) return NextResponse.json({ ok: false, error: "Your name is required." }, { status: 400 });
    if (!payload.senderPhone) return NextResponse.json({ ok: false, error: "Your phone is required." }, { status: 400 });
    if (!payload.message) return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });

    const saved = await saveMessage(payload);

    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | undefined;
    if (isEmailConfigured()) {
      const subject = `Sold Iron: New message about ${payload.listingTitle || "your listing"}`;
      const text =
        `You received a new message on Sold Iron.\n\n` +
        `From: ${payload.senderName}\n` +
        `Phone: ${payload.senderPhone}\n` +
        `Email: ${payload.senderEmail || "Not provided"}\n` +
        `Listing: ${payload.listingTitle || payload.listingId}\n\n` +
        `Message:\n${payload.message}`;
      const email = await sendEmailNotification({
        to: payload.sellerEmail,
        subject,
        text,
      });
      emailStatus = email.ok ? "sent" : "failed";
      emailError = email.error;
    }

    return NextResponse.json({ ok: true, id: saved.id, emailStatus, emailError }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ ok: false, error: "Failed to send message.", debug: { message } }, { status: 500 });
  }
}

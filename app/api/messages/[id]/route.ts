import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { getMessageForSellerById } from "@/lib/message-store";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookies();
    const sellerEmail = clean(session?.email).toLowerCase();

    if (!sellerEmail) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const subscription = await getSubscriptionByEmail(sellerEmail);
    if (subscription?.status !== "active") {
      return NextResponse.json({ ok: false, error: "Active subscription required." }, { status: 402 });
    }

    const message = await getMessageForSellerById(id, sellerEmail);
    if (!message) {
      return NextResponse.json({ ok: false, error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load message." }, { status: 500 });
  }
}

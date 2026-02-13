import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/stripe";
import { upsertSubscription } from "@/lib/subscription-store";

type StripeCheckoutSession = {
  customer?: string;
  customer_email?: string;
  customer_details?: { email?: string };
  subscription?: string;
  metadata?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const { secretKey } = getStripeConfig();
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "Missing STRIPE_SECRET_KEY." }, { status: 500 });
    }

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim() ?? "";
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing session id." }, { status: 400 });
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "Invalid checkout session." }, { status: 400 });
    }

    const session = (await response.json()) as StripeCheckoutSession;
    const email =
      session.customer_email?.toLowerCase() ??
      session.customer_details?.email?.toLowerCase() ??
      session.metadata?.email?.toLowerCase() ??
      "";
    const subscriptionId = session.subscription ?? "";

    if (!email || !subscriptionId) {
      return NextResponse.json(
        { ok: false, error: "Session missing email or subscription id." },
        { status: 400 }
      );
    }

    await upsertSubscription({
      email,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscriptionId,
      status: "active",
      planName: "Sold Iron Subscription",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not confirm session." }, { status: 500 });
  }
}

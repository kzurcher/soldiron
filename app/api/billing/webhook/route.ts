import { NextResponse } from "next/server";
import { getStripeConfig, verifyStripeSignature } from "@/lib/stripe";
import { updateSubscriptionStatusByStripeId, upsertSubscription } from "@/lib/subscription-store";

type StripeEvent = {
  type: string;
  data: {
    object: {
      id?: string;
      status?: string;
      customer?: string;
      subscription?: string;
      customer_email?: string;
      customer_details?: { email?: string };
      metadata?: Record<string, string>;
    };
  };
};

function normalizeStatus(input?: string): "active" | "canceled" | "past_due" | "incomplete" {
  if (input === "active") return "active";
  if (input === "canceled") return "canceled";
  if (input === "past_due") return "past_due";
  return "incomplete";
}

export async function POST(request: Request) {
  const { webhookSecret } = getStripeConfig();
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const email = obj.customer_email ?? obj.customer_details?.email ?? obj.metadata?.email ?? "";
    const subscriptionId = obj.subscription ?? "";
    if (email && subscriptionId) {
      await upsertSubscription({
        email,
        stripeCustomerId: obj.customer,
        stripeSubscriptionId: subscriptionId,
        status: "active",
        planName: "Sold Iron Subscription",
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSubscriptionId = obj.id ?? "";
    if (stripeSubscriptionId) {
      await updateSubscriptionStatusByStripeId(stripeSubscriptionId, normalizeStatus(obj.status));
    }
  }

  return NextResponse.json({ received: true });
}

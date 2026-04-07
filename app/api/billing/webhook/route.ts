import { NextResponse } from "next/server";
import { getStripeConfig, verifyStripeSignature } from "@/lib/stripe";
import { updateSubscriptionStatusByStripeId, upsertSubscription } from "@/lib/subscription-store";
import { getUserProfileByEmail, upsertUserProfile } from "@/lib/user-profile-store";

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
    console.error("[billing/webhook] missing webhook secret");
    return NextResponse.json({ ok: false, error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    console.error("[billing/webhook] invalid signature", {
      hasSignature: Boolean(signature),
      webhookSecretPrefix: webhookSecret.slice(0, 8),
    });
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeEvent;
  const obj = event.data.object;
  console.info("[billing/webhook] received event", {
    type: event.type,
    objectId: obj.id ?? "",
    subscriptionId: obj.subscription ?? obj.id ?? "",
    email: obj.customer_email ?? obj.customer_details?.email ?? obj.metadata?.email ?? "",
  });

  if (event.type === "checkout.session.completed") {
    const email = obj.customer_email ?? obj.customer_details?.email ?? obj.metadata?.email ?? "";
    const subscriptionId = obj.subscription ?? "";
    if (email && subscriptionId) {
      const existingProfile = await getUserProfileByEmail(email);
      await upsertUserProfile({
        email,
        fullName: obj.metadata?.fullName ?? existingProfile?.fullName,
        phoneNumber: obj.metadata?.phoneNumber ?? existingProfile?.phoneNumber,
      });
      await upsertSubscription({
        email,
        stripeCustomerId: obj.customer,
        stripeSubscriptionId: subscriptionId,
        status: "active",
        planName: "Sold Iron Subscription",
      });
      console.info("[billing/webhook] activated subscription", {
        email,
        subscriptionId,
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSubscriptionId = obj.id ?? "";
    if (stripeSubscriptionId) {
      await updateSubscriptionStatusByStripeId(stripeSubscriptionId, normalizeStatus(obj.status));
      console.info("[billing/webhook] updated subscription status", {
        stripeSubscriptionId,
        status: normalizeStatus(obj.status),
      });
    }
  }

  return NextResponse.json({ received: true });
}

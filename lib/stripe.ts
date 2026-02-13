import { createHmac, timingSafeEqual } from "node:crypto";

const stripeApiBase = "https://api.stripe.com/v1";

export function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const priceId = process.env.STRIPE_PRICE_ID ?? "";
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return { secretKey, priceId, yearlyPriceId, webhookSecret, appUrl };
}

export async function stripePostForm(
  path: string,
  params: URLSearchParams,
  secretKey: string
): Promise<Response> {
  return fetch(`${stripeApiBase}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

type StripeCustomerList = { data?: Array<{ id: string }> };
type StripeSubscriptionList = { data?: Array<{ status?: string }> };
type StripeCheckoutSession = {
  customer_email?: string;
  customer_details?: { email?: string };
  subscription?: string;
};

export type StripeSubscriptionDebug = {
  active: boolean;
  normalizedEmail: string;
  customerCount: number;
  statuses: string[];
  reason: string;
};

export async function getStripeSubscriptionDebug(email: string): Promise<StripeSubscriptionDebug> {
  const { secretKey } = getStripeConfig();
  const normalizedEmail = email.trim().toLowerCase();
  if (!secretKey) {
    return {
      active: false,
      normalizedEmail,
      customerCount: 0,
      statuses: [],
      reason: "missing_secret_key",
    };
  }
  if (!normalizedEmail) {
    return {
      active: false,
      normalizedEmail,
      customerCount: 0,
      statuses: [],
      reason: "missing_email",
    };
  }

  const customerResponse = await fetch(
    `${stripeApiBase}/customers?email=${encodeURIComponent(normalizedEmail)}&limit=100`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  if (!customerResponse.ok) {
    return {
      active: false,
      normalizedEmail,
      customerCount: 0,
      statuses: [],
      reason: `customer_lookup_failed_${customerResponse.status}`,
    };
  }

  const customers = (await customerResponse.json()) as StripeCustomerList;
  const customerIds = (customers.data ?? []).map((c) => c.id).filter(Boolean);
  if (customerIds.length === 0) {
    return {
      active: false,
      normalizedEmail,
      customerCount: 0,
      statuses: [],
      reason: "no_customer_found",
    };
  }

  const statuses: string[] = [];
  for (const customerId of customerIds) {
    const subResponse = await fetch(
      `${stripeApiBase}/subscriptions?customer=${encodeURIComponent(
        customerId
      )}&status=all&limit=100`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    if (!subResponse.ok) {
      statuses.push(`subscription_lookup_failed_${subResponse.status}`);
      continue;
    }

    const subs = (await subResponse.json()) as StripeSubscriptionList;
    const subStatuses = (subs.data ?? []).map((sub) => sub.status ?? "unknown");
    statuses.push(...subStatuses);
  }

  const active = statuses.some((status) => status === "active" || status === "trialing");
  return {
    active,
    normalizedEmail,
    customerCount: customerIds.length,
    statuses,
    reason: active ? "active_found" : "no_active_subscription",
  };
}

export async function hasActiveStripeSubscription(email: string): Promise<boolean> {
  const result = await getStripeSubscriptionDebug(email);
  return result.active;
}

export async function isCheckoutSessionActiveForEmail(
  sessionId: string,
  email: string
): Promise<boolean> {
  const { secretKey } = getStripeConfig();
  const normalizedEmail = email.trim().toLowerCase();
  if (!secretKey || !sessionId || !normalizedEmail) return false;

  const sessionResponse = await fetch(`${stripeApiBase}/checkout/sessions/${sessionId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!sessionResponse.ok) return false;

  const session = (await sessionResponse.json()) as StripeCheckoutSession;
  const sessionEmail =
    session.customer_email?.toLowerCase() ?? session.customer_details?.email?.toLowerCase() ?? "";
  const subscriptionId = session.subscription ?? "";
  if (!sessionEmail || !subscriptionId || sessionEmail !== normalizedEmail) return false;

  const subResponse = await fetch(`${stripeApiBase}/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!subResponse.ok) return false;
  const sub = (await subResponse.json()) as { status?: string };
  return sub.status === "active" || sub.status === "trialing";
}

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  const parts = signatureHeader.split(",").map((p) => p.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(v1, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

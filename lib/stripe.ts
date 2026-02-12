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

export async function hasActiveStripeSubscription(email: string): Promise<boolean> {
  const { secretKey } = getStripeConfig();
  const normalizedEmail = email.trim().toLowerCase();
  if (!secretKey || !normalizedEmail) return false;

  const customerResponse = await fetch(
    `${stripeApiBase}/customers?email=${encodeURIComponent(normalizedEmail)}&limit=100`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  if (!customerResponse.ok) return false;
  const customers = (await customerResponse.json()) as StripeCustomerList;
  const customerIds = (customers.data ?? []).map((c) => c.id).filter(Boolean);
  if (customerIds.length === 0) return false;

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
    if (!subResponse.ok) continue;

    const subs = (await subResponse.json()) as StripeSubscriptionList;
    const active = (subs.data ?? []).some(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );
    if (active) return true;
  }

  return false;
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

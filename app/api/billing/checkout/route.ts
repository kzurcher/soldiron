import { NextResponse } from "next/server";
import { getStripeConfig, stripePostForm } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { secretKey, priceId, yearlyPriceId, appUrl } = getStripeConfig();
    const missing: string[] = [];
    if (!secretKey) missing.push("STRIPE_SECRET_KEY");
    if (!priceId) missing.push("STRIPE_PRICE_ID");
    if (!yearlyPriceId) missing.push("STRIPE_YEARLY_PRICE_ID");
    if (!appUrl) missing.push("NEXT_PUBLIC_APP_URL");

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Stripe is not configured. Missing env vars: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { email?: string; plan?: "monthly" | "yearly" };
    const email = body.email?.trim().toLowerCase() ?? "";
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const selectedPriceId = plan === "yearly" ? yearlyPriceId || priceId : priceId;

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/subscribe/cancel`);
    params.set("line_items[0][price]", selectedPriceId);
    params.set("line_items[0][quantity]", "1");
    params.set("customer_email", email);

    const response = await stripePostForm("/checkout/sessions", params, secretKey);
    const result = (await response.json()) as { url?: string; error?: { message?: string } };

    if (!response.ok || !result.url) {
      return NextResponse.json(
        { ok: false, error: result.error?.message ?? "Could not create checkout session." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, url: result.url });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not start subscription checkout." },
      { status: 500 }
    );
  }
}

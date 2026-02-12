import { NextResponse } from "next/server";
import { getStripeConfig, stripePostForm } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { secretKey, priceId, yearlyPriceId, appUrl } = getStripeConfig();
    if (!secretKey || !priceId) {
      return NextResponse.json(
        { ok: false, error: "Stripe is not configured. Missing env vars." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { email?: string; plan?: "monthly" | "yearly" };
    const email = body.email?.trim() ?? "";
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

import { NextResponse } from "next/server";
import { getStripeConfig, stripePostForm } from "@/lib/stripe";
import { upsertUserProfile } from "@/lib/user-profile-store";

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

    const body = (await request.json()) as {
      email?: string;
      plan?: "monthly" | "yearly";
      fullName?: string;
      phoneNumber?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    const fullName = body.fullName?.trim() ?? "";
    const phoneNumber = body.phoneNumber?.trim() ?? "";
    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ ok: false, error: "Full name is required." }, { status: 400 });
    }
    if (!phoneNumber) {
      return NextResponse.json({ ok: false, error: "Phone number is required." }, { status: 400 });
    }

    console.info("[billing/checkout] received request", {
      email,
      plan,
      hasFullName: Boolean(fullName),
      hasPhoneNumber: Boolean(phoneNumber),
    });

    const profile = await upsertUserProfile({ email, fullName, phoneNumber });
    console.info("[billing/checkout] upserted user profile", {
      email: profile.email,
      updatedAt: profile.updatedAt,
    });

    const selectedPriceId = plan === "yearly" ? yearlyPriceId || priceId : priceId;

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/subscribe/cancel`);
    params.set("line_items[0][price]", selectedPriceId);
    params.set("line_items[0][quantity]", "1");
    params.set("customer_email", email);
    params.set("metadata[email]", email);
    params.set("metadata[fullName]", fullName);
    params.set("metadata[phoneNumber]", phoneNumber);
    params.set("subscription_data[metadata][email]", email);
    params.set("subscription_data[metadata][fullName]", fullName);
    params.set("subscription_data[metadata][phoneNumber]", phoneNumber);

    const response = await stripePostForm("/checkout/sessions", params, secretKey);
    const result = (await response.json()) as { url?: string; error?: { message?: string } };

    if (!response.ok || !result.url) {
      console.error("[billing/checkout] stripe checkout creation failed", {
        email,
        status: response.status,
        error: result.error?.message ?? "unknown_stripe_error",
      });
      return NextResponse.json(
        { ok: false, error: result.error?.message ?? "Could not create checkout session." },
        { status: 400 }
      );
    }

    console.info("[billing/checkout] created stripe checkout session", {
      email,
      status: response.status,
    });

    return NextResponse.json({ ok: true, url: result.url });
  } catch (error) {
    console.error("[billing/checkout] unexpected failure", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { ok: false, error: "Could not start subscription checkout." },
      { status: 500 }
    );
  }
}

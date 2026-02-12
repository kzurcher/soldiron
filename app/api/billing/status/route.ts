import { NextResponse } from "next/server";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const subscription = await getSubscriptionByEmail(email);
  return NextResponse.json({
    ok: true,
    active: subscription?.status === "active",
    status: subscription?.status ?? "none",
    subscription: subscription ?? null,
  });
}

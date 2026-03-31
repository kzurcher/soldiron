import { NextResponse } from "next/server";
import { getSubscriptionByEmail } from "@/lib/subscription-store";
import { clearSessionCookie, getSessionFromCookies } from "@/lib/session";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  const subscription = await getSubscriptionByEmail(session.email);
  return NextResponse.json({
    ok: true,
    authenticated: true,
    session: {
      email: session.email,
      fullName: session.fullName,
      phoneNumber: session.phoneNumber,
    },
    active: subscription?.status === "active",
    subscription: subscription ?? null,
  });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

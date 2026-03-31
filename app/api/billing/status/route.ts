import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { getSubscriptionByEmail } from "@/lib/subscription-store";
import { getUserProfileByEmail } from "@/lib/user-profile-store";

export async function GET() {
  const session = await getSessionFromCookies();
  const email = session?.email?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const subscription = await getSubscriptionByEmail(email);
  const profile = await getUserProfileByEmail(email);
  return NextResponse.json({
    ok: true,
    authenticated: true,
    active: subscription?.status === "active",
    status: subscription?.status ?? "none",
    subscription: subscription ?? null,
    session: {
      email,
      fullName: profile?.fullName ?? session?.fullName ?? "",
      phoneNumber: profile?.phoneNumber ?? session?.phoneNumber ?? "",
    },
  });
}

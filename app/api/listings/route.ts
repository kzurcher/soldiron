import { NextResponse } from "next/server";
import { getListingSubmissions } from "@/lib/listing-store";
import { getSessionFromCookies } from "@/lib/session";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session?.email) {
      return NextResponse.json({ ok: false, error: "Authentication required.", listings: [] }, { status: 401 });
    }

    const subscription = await getSubscriptionByEmail(session.email);
    if (subscription?.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Active subscription required.", listings: [] },
        { status: 402 }
      );
    }

    const listings = await getListingSubmissions();
    return NextResponse.json({ ok: true, listings });
  } catch {
    return NextResponse.json({ ok: false, listings: [] }, { status: 500 });
  }
}

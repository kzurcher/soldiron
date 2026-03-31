import { NextResponse } from "next/server";
import { getListingSubmissions } from "@/lib/listing-store";
import { getSessionFromCookies } from "@/lib/session";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const session = await getSessionFromCookies();
    if (!session?.email) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const subscription = await getSubscriptionByEmail(session.email);
    if (subscription?.status !== "active") {
      return NextResponse.json({ ok: false, error: "Active subscription required." }, { status: 402 });
    }

    const { id } = await params;
    const listings = await getListingSubmissions();
    const listing = listings.find((record) => record.id === id);

    if (!listing) {
      return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, listing });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load listing." }, { status: 500 });
  }
}

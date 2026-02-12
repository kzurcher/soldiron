import { NextResponse } from "next/server";
import { getListingSubmissions } from "@/lib/listing-store";

export async function GET() {
  try {
    const listings = await getListingSubmissions();
    return NextResponse.json({ ok: true, listings });
  } catch {
    return NextResponse.json({ ok: false, listings: [] }, { status: 500 });
  }
}

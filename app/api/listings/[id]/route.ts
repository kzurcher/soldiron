import { NextResponse } from "next/server";
import { getListingSubmissions } from "@/lib/listing-store";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
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

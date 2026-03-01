import { NextResponse } from "next/server";
import { getMessageForSellerById } from "@/lib/message-store";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sellerEmail = clean(searchParams.get("email") ?? undefined).toLowerCase();

    if (!sellerEmail) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const message = await getMessageForSellerById(id, sellerEmail);
    if (!message) {
      return NextResponse.json({ ok: false, error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load message." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { saveListingSubmission, type ListingSubmissionInput } from "@/lib/listing-store";
import { getStripeSubscriptionDebug, isCheckoutSessionActiveForEmail } from "@/lib/stripe";
import { getSubscriptionByEmail } from "@/lib/subscription-store";

function normalize(body: Partial<ListingSubmissionInput>): Omit<ListingSubmissionInput, "photoPaths"> {
  return {
    listingType: body.listingType?.trim() ?? "equipment",
    make: body.make?.trim() ?? "",
    model: body.model?.trim() ?? "",
    year: body.year?.trim() ?? "",
    operatingHours: body.operatingHours?.trim() ?? "",
    serialNumber: body.serialNumber?.trim() ?? "",
    location: body.location?.trim() ?? "",
    latitude: body.latitude?.trim() ?? "",
    longitude: body.longitude?.trim() ?? "",
    askingPrice: body.askingPrice?.trim() ?? "",
    description: body.description?.trim() ?? "",
    fullName: body.fullName?.trim() ?? "",
    companyName: body.companyName?.trim() ?? "",
    email: body.email?.trim() ?? "",
    phoneNumber: body.phoneNumber?.trim() ?? "",
  };
}

function validate(input: Omit<ListingSubmissionInput, "photoPaths">): string | null {
  if (!input.make) return "Make is required.";
  if (!["equipment", "attachment", "truck"].includes(input.listingType)) {
    return "Listing type is invalid.";
  }
  if (!input.model) return "Model is required.";
  if (!input.year) return "Year is required.";
  if (!input.location) return "Location is required.";
  if (!input.askingPrice) return "Asking price is required.";
  if (!input.description) return "Description is required.";
  if (!input.fullName) return "Full name is required.";
  if (!input.email) return "Email is required.";
  return null;
}

function cleanFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "upload";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const input = normalize({
      listingType: String(formData.get("listingType") ?? "equipment"),
      make: String(formData.get("make") ?? ""),
      model: String(formData.get("model") ?? ""),
      year: String(formData.get("year") ?? ""),
      operatingHours: String(formData.get("operatingHours") ?? ""),
      serialNumber: String(formData.get("serialNumber") ?? ""),
      location: String(formData.get("location") ?? ""),
      latitude: String(formData.get("latitude") ?? ""),
      longitude: String(formData.get("longitude") ?? ""),
      askingPrice: String(formData.get("askingPrice") ?? ""),
      description: String(formData.get("description") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
    });
    const checkoutSessionId = String(formData.get("checkoutSessionId") ?? "");
    const error = validate(input);

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    const localSub = await getSubscriptionByEmail(input.email);
    const subscriptionDebug = await getStripeSubscriptionDebug(input.email);
    const checkoutSessionActive = checkoutSessionId
      ? await isCheckoutSessionActiveForEmail(checkoutSessionId, input.email)
      : false;
    const isActive = localSub?.status === "active" || subscriptionDebug.active || checkoutSessionActive;
    if (!isActive) {
      return NextResponse.json(
        {
          ok: false,
          error: "An active subscription is required to submit listings.",
          debug: {
            email: subscriptionDebug.normalizedEmail,
            reason: subscriptionDebug.reason,
            customerCount: subscriptionDebug.customerCount,
            statuses: subscriptionDebug.statuses,
            checkoutSessionActive,
          },
        },
        { status: 402 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "listings");
    await mkdir(uploadDir, { recursive: true });

    const files = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const photoPaths: string[] = [];
    for (const file of files) {
      const safeName = cleanFilename(file.name);
      const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
      const diskPath = path.join(uploadDir, filename);
      const publicPath = `/uploads/listings/${filename}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(diskPath, buffer);
      photoPaths.push(publicPath);
    }

    const saved = await saveListingSubmission({ ...input, photoPaths });
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to submit listing request." },
      { status: 500 }
    );
  }
}

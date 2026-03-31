import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export type ListingSubmissionInput = {
  listingType: string;
  category: string;
  make: string;
  model: string;
  year: string;
  operatingHours: string;
  serialNumber: string;
  location: string;
  latitude: string;
  longitude: string;
  askingPrice: string;
  description: string;
  photoPaths: string[];
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
};

type StoredListingSubmission = ListingSubmissionInput & {
  id: string;
  createdAt: string;
};

declare global {
  var soldironListingCache: StoredListingSubmission[] | undefined;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "listings.json");

async function readListings(): Promise<StoredListingSubmission[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, seller_email, listing_type, category, make, model, year, operating_hours, serial_number, location, latitude, longitude, asking_price, description, photo_paths, full_name, company_name, phone_number, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((listing) => ({
      id: listing.id,
      listingType: listing.listing_type,
      category: listing.category,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      operatingHours: listing.operating_hours ?? "",
      serialNumber: listing.serial_number ?? "",
      location: listing.location,
      latitude: listing.latitude ?? "",
      longitude: listing.longitude ?? "",
      askingPrice: listing.asking_price,
      description: listing.description,
      photoPaths: listing.photo_paths ?? [],
      fullName: listing.full_name,
      companyName: listing.company_name ?? "",
      email: listing.seller_email,
      phoneNumber: listing.phone_number ?? "",
      createdAt: listing.created_at,
    }));
  }

  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Array<
      StoredListingSubmission | (Omit<StoredListingSubmission, "category"> & { category?: string })
    >;
    return parsed.map((listing) => ({
      ...listing,
      category:
        listing.category ??
        (listing.listingType === "truck" ? "truck" : "compact-equipment"),
    }));
  } catch {
    return globalThis.soldironListingCache ?? [];
  }
}

export async function getListingSubmissions(): Promise<StoredListingSubmission[]> {
  return readListings();
}

export async function saveListingSubmission(
  payload: ListingSubmissionInput
): Promise<StoredListingSubmission> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_email: payload.email.trim().toLowerCase(),
        listing_type: payload.listingType,
        category: payload.category,
        make: payload.make,
        model: payload.model,
        year: payload.year,
        operating_hours: payload.operatingHours || null,
        serial_number: payload.serialNumber || null,
        location: payload.location,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        asking_price: payload.askingPrice,
        description: payload.description,
        photo_paths: payload.photoPaths,
        full_name: payload.fullName,
        company_name: payload.companyName || null,
        phone_number: payload.phoneNumber || null,
      })
      .select(
        "id, seller_email, listing_type, category, make, model, year, operating_hours, serial_number, location, latitude, longitude, asking_price, description, photo_paths, full_name, company_name, phone_number, created_at"
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not save listing.");
    }

    return {
      id: data.id,
      listingType: data.listing_type,
      category: data.category,
      make: data.make,
      model: data.model,
      year: data.year,
      operatingHours: data.operating_hours ?? "",
      serialNumber: data.serial_number ?? "",
      location: data.location,
      latitude: data.latitude ?? "",
      longitude: data.longitude ?? "",
      askingPrice: data.asking_price,
      description: data.description,
      photoPaths: data.photo_paths ?? [],
      fullName: data.full_name,
      companyName: data.company_name ?? "",
      email: data.seller_email,
      phoneNumber: data.phone_number ?? "",
      createdAt: data.created_at,
    };
  }

  const current = await readListings();

  const record: StoredListingSubmission = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  current.unshift(record);
  globalThis.soldironListingCache = current;

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(current, null, 2), "utf8");
  } catch {
    // Serverless runtimes can be read-only. Keep in-memory cache as fallback.
  }
  return record;
}

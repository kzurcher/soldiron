import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ListingSubmissionInput = {
  listingType: string;
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
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as StoredListingSubmission[];
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

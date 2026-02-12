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

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "listings.json");

async function readListings(): Promise<StoredListingSubmission[]> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as StoredListingSubmission[];
  } catch {
    return [];
  }
}

export async function getListingSubmissions(): Promise<StoredListingSubmission[]> {
  return readListings();
}

export async function saveListingSubmission(
  payload: ListingSubmissionInput
): Promise<StoredListingSubmission> {
  await mkdir(dataDir, { recursive: true });
  const current = await readListings();

  const record: StoredListingSubmission = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  current.unshift(record);
  await writeFile(dbPath, JSON.stringify(current, null, 2), "utf8");
  return record;
}

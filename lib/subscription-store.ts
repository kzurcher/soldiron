import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SubscriptionRecord = {
  email: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "canceled" | "past_due" | "incomplete";
  planName: string;
  updatedAt: string;
};

declare global {
  var soldironSubscriptionCache: SubscriptionRecord[] | undefined;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "subscriptions.json");

async function readSubscriptions(): Promise<SubscriptionRecord[]> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as SubscriptionRecord[];
  } catch {
    return globalThis.soldironSubscriptionCache ?? [];
  }
}

async function writeSubscriptions(records: SubscriptionRecord[]): Promise<void> {
  globalThis.soldironSubscriptionCache = records;
  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(records, null, 2), "utf8");
  } catch {
    // Serverless runtimes can be read-only. Keep in-memory cache as fallback.
  }
}

export async function upsertSubscription(
  next: Omit<SubscriptionRecord, "updatedAt">
): Promise<SubscriptionRecord> {
  const records = await readSubscriptions();
  const now = new Date().toISOString();

  const index = records.findIndex(
    (record) =>
      record.email.toLowerCase() === next.email.toLowerCase() ||
      (next.stripeSubscriptionId &&
        record.stripeSubscriptionId &&
        record.stripeSubscriptionId === next.stripeSubscriptionId)
  );

  const merged: SubscriptionRecord = {
    ...next,
    updatedAt: now,
  };

  if (index >= 0) {
    records[index] = { ...records[index], ...merged, updatedAt: now };
  } else {
    records.unshift(merged);
  }

  await writeSubscriptions(records);
  return merged;
}

export async function getSubscriptionByEmail(email: string): Promise<SubscriptionRecord | null> {
  const records = await readSubscriptions();
  const match = records.find((record) => record.email.toLowerCase() === email.toLowerCase());
  return match ?? null;
}

export async function updateSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  status: SubscriptionRecord["status"]
): Promise<void> {
  const records = await readSubscriptions();
  const idx = records.findIndex((record) => record.stripeSubscriptionId === stripeSubscriptionId);
  if (idx < 0) return;

  records[idx] = { ...records[idx], status, updatedAt: new Date().toISOString() };
  await writeSubscriptions(records);
}

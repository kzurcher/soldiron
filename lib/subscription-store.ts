import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("email, stripe_customer_id, stripe_subscription_id, status, plan_name, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((record) => ({
      email: record.email,
      stripeCustomerId: record.stripe_customer_id ?? undefined,
      stripeSubscriptionId: record.stripe_subscription_id ?? undefined,
      status: record.status,
      planName: record.plan_name,
      updatedAt: record.updated_at,
    }));
  }

  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as SubscriptionRecord[];
  } catch {
    return globalThis.soldironSubscriptionCache ?? [];
  }
}

async function writeSubscriptions(records: SubscriptionRecord[]): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const payload = records.map((record) => ({
      email: record.email,
      stripe_customer_id: record.stripeCustomerId ?? null,
      stripe_subscription_id: record.stripeSubscriptionId ?? null,
      status: record.status,
      plan_name: record.planName,
      updated_at: record.updatedAt,
    }));
    const { error } = await supabase.from("subscriptions").upsert(payload, { onConflict: "email" });
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

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
  if (isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          email: next.email.trim().toLowerCase(),
          stripe_customer_id: next.stripeCustomerId ?? null,
          stripe_subscription_id: next.stripeSubscriptionId ?? null,
          status: next.status,
          plan_name: next.planName,
          updated_at: now,
        },
        { onConflict: "email" }
      )
      .select("email, stripe_customer_id, stripe_subscription_id, status, plan_name, updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not upsert subscription.");
    }

    return {
      email: data.email,
      stripeCustomerId: data.stripe_customer_id ?? undefined,
      stripeSubscriptionId: data.stripe_subscription_id ?? undefined,
      status: data.status,
      planName: data.plan_name,
      updatedAt: data.updated_at,
    };
  }

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("email, stripe_customer_id, stripe_subscription_id, status, plan_name, updated_at")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;
    return {
      email: data.email,
      stripeCustomerId: data.stripe_customer_id ?? undefined,
      stripeSubscriptionId: data.stripe_subscription_id ?? undefined,
      status: data.status,
      planName: data.plan_name,
      updatedAt: data.updated_at,
    };
  }

  const records = await readSubscriptions();
  const match = records.find((record) => record.email.toLowerCase() === email.toLowerCase());
  return match ?? null;
}

export async function updateSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  status: SubscriptionRecord["status"]
): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", stripeSubscriptionId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const records = await readSubscriptions();
  const idx = records.findIndex((record) => record.stripeSubscriptionId === stripeSubscriptionId);
  if (idx < 0) return;

  records[idx] = { ...records[idx], status, updatedAt: new Date().toISOString() };
  await writeSubscriptions(records);
}

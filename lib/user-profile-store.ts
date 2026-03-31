import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export type UserProfile = {
  email: string;
  fullName: string;
  phoneNumber: string;
  updatedAt: string;
};

declare global {
  var soldironUserProfileCache: UserProfile[] | undefined;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "user_profiles.json");

async function readLocalProfiles(): Promise<UserProfile[]> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as UserProfile[];
  } catch {
    return globalThis.soldironUserProfileCache ?? [];
  }
}

async function writeLocalProfiles(records: UserProfile[]): Promise<void> {
  globalThis.soldironUserProfileCache = records;
  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(records, null, 2), "utf8");
  } catch {
    // Serverless runtimes can be read-only. Keep in-memory cache as fallback.
  }
}

export async function upsertUserProfile(input: {
  email: string;
  fullName?: string;
  phoneNumber?: string;
}): Promise<UserProfile> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim() ?? "";
  const phoneNumber = input.phoneNumber?.trim() ?? "";
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          email,
          full_name: fullName || null,
          phone_number: phoneNumber || null,
          updated_at: updatedAt,
        },
        { onConflict: "email" }
      )
      .select("email, full_name, phone_number, updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not upsert user profile.");
    }

    return {
      email: data.email,
      fullName: data.full_name ?? "",
      phoneNumber: data.phone_number ?? "",
      updatedAt: data.updated_at,
    };
  }

  const records = await readLocalProfiles();
  const next: UserProfile = { email, fullName, phoneNumber, updatedAt };
  const index = records.findIndex((record) => record.email.toLowerCase() === email);
  if (index >= 0) {
    records[index] = { ...records[index], ...next };
  } else {
    records.unshift(next);
  }
  await writeLocalProfiles(records);
  return next;
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("email, full_name, phone_number, updated_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;
    return {
      email: data.email,
      fullName: data.full_name ?? "",
      phoneNumber: data.phone_number ?? "",
      updatedAt: data.updated_at,
    };
  }

  const records = await readLocalProfiles();
  return records.find((record) => record.email.toLowerCase() === normalizedEmail) ?? null;
}

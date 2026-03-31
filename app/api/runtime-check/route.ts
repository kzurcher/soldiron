import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { upsertUserProfile } from "@/lib/user-profile-store";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  let database: Record<string, unknown> = {
    connected: false,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { count, error } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      if (error) {
        database = {
          connected: false,
          error: error.message,
        };
      } else {
        database = {
          connected: true,
          userProfilesCount: count ?? 0,
        };
      }
    } catch (error) {
      database = {
        connected: false,
        error: error instanceof Error ? error.message : "unknown_database_error",
      };
    }
  }

  return NextResponse.json({
    ok: true,
    runtime: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    supabaseConfigured: isSupabaseConfigured(),
    checks: {
      hasSupabaseUrl: Boolean(supabaseUrl),
      supabaseUrlHost: supabaseUrl ? new URL(supabaseUrl).host : "",
      hasSupabaseServiceRoleKey: Boolean(serviceRoleKey),
      supabaseServiceRolePrefix: serviceRoleKey.slice(0, 10),
      hasSessionSecret: Boolean(sessionSecret),
      sessionSecretLength: sessionSecret.length,
    },
    database,
  });
}

export async function POST() {
  try {
    const email = `runtime-check-${Date.now()}@soldiron.test`;
    const profile = await upsertUserProfile({
      email,
      fullName: "Runtime Check",
      phoneNumber: "0000000000",
    });

    return NextResponse.json({
      ok: true,
      inserted: true,
      profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        inserted: false,
        error: error instanceof Error ? error.message : "unknown_insert_error",
      },
      { status: 500 }
    );
  }
}

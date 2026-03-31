import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";

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
  });
}

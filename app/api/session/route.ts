import { NextResponse } from "next/server";
import { getSubscriptionByEmail } from "@/lib/subscription-store";
import { clearSessionCookie, getSessionFromCookies, setSessionCookie } from "@/lib/session";
import { getUserProfileByEmail } from "@/lib/user-profile-store";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json(
      { ok: false, authenticated: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  const subscription = await getSubscriptionByEmail(session.email);
  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      session: {
        email: session.email,
        fullName: session.fullName,
        phoneNumber: session.phoneNumber,
      },
      active: subscription?.status === "active",
      subscription: subscription ?? null,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const profile = await getUserProfileByEmail(email);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "No account found for that email." },
        { status: 404 }
      );
    }

    const subscription = await getSubscriptionByEmail(email);
    await setSessionCookie({
      email,
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
    });

    return NextResponse.json({
      ok: true,
      authenticated: true,
      active: subscription?.status === "active",
      subscription: subscription ?? null,
      session: {
        email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not sign in.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

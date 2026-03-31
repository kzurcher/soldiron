import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookieName = "soldiron_session";
const sessionDurationSeconds = 60 * 60 * 24 * 30;

export type AppSession = {
  email: string;
  fullName: string;
  phoneNumber: string;
  expiresAt: number;
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET ?? process.env.STRIPE_SECRET_KEY ?? "";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSessionPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function serializeSession(session: AppSession): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Missing session secret.");
  }
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

function deserializeSession(rawValue: string): AppSession | null {
  const secret = getSessionSecret();
  if (!secret || !rawValue.includes(".")) return null;

  const [payload, signature] = rawValue.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signSessionPayload(payload, secret);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, receivedBuffer)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as AppSession;
    if (!parsed.email || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      fullName: parsed.fullName ?? "",
      phoneNumber: parsed.phoneNumber ?? "",
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(input: {
  email: string;
  fullName?: string;
  phoneNumber?: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const session: AppSession = {
    email: input.email.trim().toLowerCase(),
    fullName: input.fullName?.trim() ?? "",
    phoneNumber: input.phoneNumber?.trim() ?? "",
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
  };

  cookieStore.set(sessionCookieName, serializeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookies(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(sessionCookieName)?.value ?? "";
  return deserializeSession(rawValue);
}

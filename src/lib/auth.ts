import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

const SESSION_DAYS = 7;
export const MIN_PASSWORD_LENGTH = 16;

/* "__Host-" makes the browser refuse the cookie unless it is Secure, host-only
   and path=/, so a sibling subdomain can never set or overwrite it. Browsers
   only accept that over HTTPS, so plain-http local dev uses the bare name. */
export const ADMIN_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-r208_admin" : "r208_admin";

/* No default password: ADMIN_PASSWORD must be set as an environment variable.
   If it is missing or too short, login fails closed and isAdmin() is false. */
export function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD env var is required (min ${MIN_PASSWORD_LENGTH} characters).`
    );
  }
  return pw;
}

function sha256(s: string): Buffer {
  return createHash("sha256").update(s, "utf8").digest();
}

/* Hashing both sides first gives equal-length buffers, so the constant-time
   comparison doesn't leak the password's length either. */
export function checkPassword(candidate: string): boolean {
  return timingSafeEqual(sha256(candidate || ""), sha256(adminPassword()));
}

/* Sessions are random tokens. The database stores only their SHA-256, and a
   session can be revoked (sign out) or simply expire. */
export async function createSession(): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(adminSessions).values({ id: sha256(token).toString("hex"), expiresAt });
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

async function currentToken(): Promise<string | null> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return value && value.length <= 100 ? value : null;
}

export async function isAdmin(): Promise<boolean> {
  try {
    adminPassword();
  } catch {
    return false;
  }
  const token = await currentToken();
  if (!token) return false;
  try {
    const [row] = await db
      .select({ id: adminSessions.id })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.id, sha256(token).toString("hex")),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    return !!row;
  } catch {
    return false;
  }
}

/* Ends this browser's session, or every session when `everywhere` is set. */
export async function endSession(everywhere: boolean): Promise<void> {
  if (everywhere) {
    await db.delete(adminSessions);
    return;
  }
  const token = await currentToken();
  if (token) {
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.id, sha256(token).toString("hex")));
  }
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

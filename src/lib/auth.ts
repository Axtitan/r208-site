import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "r208_admin";

/* No default password: ADMIN_PASSWORD must be set as an environment variable.
   If it is missing, login simply fails closed and isAdmin() returns false. */
export function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) {
    throw new Error("ADMIN_PASSWORD env var is required (min 8 characters).");
  }
  return pw;
}

export function adminToken(): string {
  return createHash("sha256")
    .update("r208-cms::" + adminPassword())
    .digest("hex");
}

/* Constant-time comparison so login timing leaks nothing about the password. */
export function checkPassword(candidate: string): boolean {
  const expected = Buffer.from(adminPassword(), "utf8");
  const given = Buffer.from(candidate || "", "utf8");
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export async function isAdmin(): Promise<boolean> {
  let token: string;
  try {
    token = adminToken();
  } catch {
    return false;
  }
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value || value.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(token));
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

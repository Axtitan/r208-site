import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/* Returns remaining lockout minutes, or 0 if the IP may attempt a login. */
export async function lockedOutMinutes(ip: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.ip, ip),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since)
      )
    );
  return count >= MAX_FAILURES ? WINDOW_MINUTES : 0;
}

export async function recordAttempt(ip: string, success: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ ip, success });
  if (success) {
    // Successful login clears the failure history for this IP.
    await db
      .delete(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false)));
  }
  // Keep the table small: drop attempts older than 24h.
  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 3600_000)));
}

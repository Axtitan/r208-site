import { db } from "@/db";
import { rateEvents } from "@/db/schema";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";

/* The client IP. On Vercel both headers are set by the platform (client-sent
   values are overwritten), so they can't be spoofed there. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/* The key an IP is rate-limited under. IPv6 users typically control a whole
   /64 (2^64 addresses), so limiting per address would be meaningless — group
   by the /64 prefix instead. */
export function rateKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right]
    : left;
  return groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/* Records one event in `bucket` for `key`, then counts events in the window
   (including this one). Recording before counting makes the limit hold under
   concurrent requests: the n-th request to count always sees at least n rows,
   so a burst can't all slip in under the threshold. */
export async function hit(
  bucket: string,
  key: string,
  windowMinutes: number
): Promise<{ id: number; count: number }> {
  const [{ id }] = await db
    .insert(rateEvents)
    .values({ bucket, key })
    .returning({ id: rateEvents.id });
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rateEvents)
    .where(
      and(eq(rateEvents.bucket, bucket), eq(rateEvents.key, key), gte(rateEvents.createdAt, since))
    );
  return { id, count };
}

/* Removes a key's events from a bucket (e.g. failures after a good login). */
export async function clearKey(bucket: string, key: string): Promise<void> {
  await db.delete(rateEvents).where(and(eq(rateEvents.bucket, bucket), eq(rateEvents.key, key)));
}

export async function deleteEvents(ids: number[]): Promise<void> {
  if (ids.length) await db.delete(rateEvents).where(inArray(rateEvents.id, ids));
}

/* Keep the table small: drop events older than 24h. */
export async function pruneEvents(): Promise<void> {
  await db
    .delete(rateEvents)
    .where(lt(rateEvents.createdAt, new Date(Date.now() - 24 * 3600_000)));
}

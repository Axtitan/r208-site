import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/auth";
import { clientIp, lockedOutMinutes, recordAttempt } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Rate limiting is best-effort: if the table is missing (pre-migration)
  // we still allow login attempts rather than locking the owner out.
  try {
    const wait = await lockedOutMinutes(ip);
    if (wait > 0) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in about ${wait} minutes.` },
        { status: 429 }
      );
    }
  } catch {
    /* login_attempts table not ready — continue */
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };

  let ok = false;
  try {
    ok = !!body.password && checkPassword(body.password);
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: ADMIN_PASSWORD is not set." },
      { status: 500 }
    );
  }

  try {
    await recordAttempt(ip, ok);
  } catch {
    /* best effort */
  }

  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // one week
  });
  return res;
}

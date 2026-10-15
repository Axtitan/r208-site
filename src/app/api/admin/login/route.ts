import { NextResponse } from "next/server";
import { MIN_PASSWORD_LENGTH, adminPassword, checkPassword, createSession, sessionCookie } from "@/lib/auth";
import { clearKey, clientIp, deleteEvents, hit, pruneEvents, rateKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const PER_IP_WINDOW_MINUTES = 15;
const PER_IP_MAX = 5;
/* A site-wide ceiling on password checks, so many IPs together (a botnet)
   still can't make more than ~60 guesses an hour. */
const SITE_WIDE_MAX_PER_HOUR = 60;

export async function POST(req: Request) {
  const key = rateKey(clientIp(req));

  // Fail closed: if attempts can't be counted, nobody gets to guess.
  let siteWideEventId = 0;
  try {
    const perIp = await hit("login", key, PER_IP_WINDOW_MINUTES);
    if (perIp.count > PER_IP_MAX) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Try again in about ${PER_IP_WINDOW_MINUTES} minutes.`,
        },
        { status: 429 }
      );
    }
    // Only attempts that pass the per-IP check count site-wide, so one
    // hammering IP can't lock everyone else out.
    const siteWide = await hit("login-all", "*", 60);
    siteWideEventId = siteWide.id;
    if (siteWide.count > SITE_WIDE_MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "Login is temporarily locked after too many attempts. Try again later." },
        { status: 429 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Login is temporarily unavailable. Try again in a minute." },
      { status: 503 }
    );
  }

  try {
    adminPassword();
  } catch {
    return NextResponse.json(
      {
        error: `Server misconfigured: ADMIN_PASSWORD must be set (min ${MIN_PASSWORD_LENGTH} characters).`,
      },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password.slice(0, 1024) : "";

  if (!password || !checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  let session: Awaited<ReturnType<typeof createSession>>;
  try {
    // A good login clears this IP's failures and doesn't use up the site-wide budget.
    await clearKey("login", key);
    await deleteEvents([siteWideEventId]);
    await pruneEvents();
    session = await createSession();
  } catch {
    return NextResponse.json(
      { error: "Login is temporarily unavailable. Try again in a minute." },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(session.token, session.expiresAt));
  return res;
}

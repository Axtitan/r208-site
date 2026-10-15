import { NextResponse } from "next/server";
import { ADMIN_COOKIE, endSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* POST — body { everywhere?: true } also ends every other session. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { everywhere?: unknown };
  try {
    await endSession(body.everywhere === true);
  } catch {
    /* still clear the cookie below */
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

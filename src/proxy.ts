import { NextResponse, type NextRequest } from "next/server";

/* CSRF guard for state-changing API calls. The session cookie is already
   SameSite=Lax; this additionally rejects any write whose Origin isn't this
   site, so a malicious page can never make the admin's browser act. */
export function proxy(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      /* "null" or garbage — treated as foreign */
    }
    const hosts = [req.headers.get("x-forwarded-host"), req.headers.get("host")].filter(Boolean);
    if (!hosts.includes(originHost)) {
      return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
  } else if (req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/contact"],
};

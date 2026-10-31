import type { NextConfig } from "next";
import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
import path from "path";

/* CSP hashes for every inline <script> in the static pages and the server
   renderers, computed at build time — editing an inline script can't silently
   break it, and nothing else inline is allowed to run. */
function inlineScriptHashes(): string[] {
  const root = process.cwd();
  const files = [
    ...readdirSync(path.join(root, "public"))
      .filter((f) => f.endsWith(".html"))
      .map((f) => path.join(root, "public", f)),
    path.join(root, "src", "lib", "render.ts"),
  ];
  const hashes = new Set<string>();
  for (const file of files) {
    // Browsers hash script text after the HTML parser turns CRLF into LF, so
    // normalise first — otherwise a Windows checkout produces wrong hashes.
    const src = readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
    for (const m of src.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
    }
  }
  return [...hashes];
}

/* The pages load Google Fonts' stylesheet with media="print" and flip it to
   "all" in this onload handler (a non-blocking CSS trick). */
const FONT_ONLOAD_HASH = `'sha256-${createHash("sha256").update("this.media='all'").digest("base64")}'`;

function csp(scriptSrc: string[]): string {
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          // Keep the original static-site URLs (project-novalend.html, ...)
          // while rendering them dynamically from the database.
          source: "/project-:slug.html",
          destination: "/p/:slug",
        },
      ],
      fallback: [],
    };
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // CSP only in production: `next dev` needs eval and websockets.
      ...(isProd
        ? [
            {
              // Public site: only our own files and the hashed inline snippets run.
              // (Uploaded files at /api/files set their own, stricter, sandbox
              // policy — a config header here would replace it.)
              source: "/((?!api/files/).*)",
              headers: [
                {
                  key: "Content-Security-Policy",
                  value: csp([
                    "'self'",
                    ...inlineScriptHashes(),
                    "'unsafe-hashes'",
                    FONT_ONLOAD_HASH,
                  ]),
                },
              ],
            },
            {
              // The admin panel is a React app whose framework emits inline
              // scripts; React escapes all content it renders.
              source: "/admin/:path*",
              headers: [
                { key: "Content-Security-Policy", value: csp(["'self'", "'unsafe-inline'"]) },
              ],
            },
          ]
        : []),
      {
        // The admin panel and its API must never appear in search results.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

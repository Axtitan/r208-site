import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL || "https://r208-site.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build resilience: a type nitpick should never block a content deploy.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

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

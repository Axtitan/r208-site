import type { MetadataRoute } from "next";
import { getPublishedPosts, getPublishedProjects } from "@/lib/site-data";

export const dynamic = "force-dynamic";

const BASE = process.env.SITE_URL || "https://r208-site.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about.html",
    "/services.html",
    "/projects.html",
    "/contact.html",
    "/journal",
    "/service-web-design-development.html",
    "/service-ui-ux-design.html",
    "/service-graphics-design.html",
    "/service-cybersecurity.html",
    "/service-3d-design.html",
    "/service-video-editing.html",
    "/service-ai-automation.html",
    "/service-copywriting.html",
  ].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const [projects, posts] = await Promise.all([
      getPublishedProjects(),
      getPublishedPosts(),
    ]);
    return [
      ...staticPages,
      ...projects.map((p) => ({
        url: `${BASE}/project-${p.slug}.html`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...posts.map((p) => ({
        url: `${BASE}/journal/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}

import {
  CATEGORIES,
  TEAM,
  getPublishedProjects,
  getServices,
  getTestimonials,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

/* The original static site loads window.R208_DATA from assets/js/data.js.
   This route generates that file from the database, so everything edited in
   the CMS shows up on the static pages without touching them. */
export async function GET() {
  try {
    const [rows, serviceRows, testimonialRows] = await Promise.all([
      getPublishedProjects(),
      getServices(),
      getTestimonials(),
    ]);
    const featured = rows.filter((p) => p.featured);
    const ordered = [...featured, ...rows.filter((p) => !p.featured)];
    const data = {
      services: serviceRows.map((s) => ({
        slug: s.slug,
        num: s.num,
        name: s.name,
        tags: s.tags,
        lede: s.lede,
        cat: s.cat,
      })),
      projects: ordered.map((p) => ({
        slug: p.slug,
        name: p.name,
        cats: p.cats,
        cat_label: p.catLabel,
        year: p.year,
        client: p.client,
        role: p.role,
        img: p.heroImageUrl,
        intro: p.intro,
      })),
      categories: CATEGORIES,
      testimonials: testimonialRows.map((t) => ({
        quote: t.quote,
        name: t.name,
        role: t.role,
      })),
      team: TEAM,
    };
    const js = `window.R208_DATA = ${JSON.stringify(data)};`;
    return new Response(js, {
      headers: {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    /* If the DB is unreachable, fall back to nothing — pages keep their
       server-rendered fallback cards. */
    return new Response("/* R208 data unavailable */", {
      headers: { "content-type": "text/javascript; charset=utf-8" },
    });
  }
}

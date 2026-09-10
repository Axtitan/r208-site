import { db } from "@/db";
import { posts, projects, services, testimonials, type Post, type Project, type ProjectSection, type ProjectLink, type Service, type Testimonial } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

/* Static content pieces that are not (yet) CMS-managed. Copied verbatim from
   the original assets/js/data.js content layer. */

export const SEED_SERVICES = [
  { slug: "web-design-development", num: "01", name: "Web Design & Development", tags: "Marketing sites / Web apps / Headless CMS", lede: "Sites that load fast, read clearly and convert. Designed and built in the same room, so nothing gets lost in handoff.", cat: "web" },
  { slug: "ui-ux-design", num: "02", name: "UI/UX Design", tags: "Product design / Design systems / Prototyping", lede: "Interfaces people move through without thinking. We design the flow first, then the surface.", cat: "uiux" },
  { slug: "graphics-design", num: "03", name: "Graphics Design", tags: "Brand identity / Print / Campaign", lede: "Identity systems with enough range to survive contact with the real world.", cat: "graphics" },
  { slug: "cybersecurity", num: "04", name: "Cybersecurity", tags: "Audits / Pen testing / Hardening", lede: "Find it before someone else does. Practical security for teams that ship weekly.", cat: "security" },
  { slug: "3d-design", num: "05", name: "3D Design", tags: "Product viz / WebGL / Motion", lede: "Product renders and real-time 3D that make a thing feel physical before it exists.", cat: "3d" },
  { slug: "video-editing", num: "06", name: "Video Editing", tags: "Brand film / Social / Motion graphics", lede: "Cuts with rhythm. Edits built around the first three seconds and the last call to action.", cat: "video" },
  { slug: "ai-automation", num: "07", name: "AI Automation", tags: "Workflows / Agents / Integrations", lede: "Take the repetitive work off your team. Automations that fail loudly, not silently.", cat: "ai" },
  { slug: "copywriting", num: "08", name: "Copywriting", tags: "Messaging / Web copy / Naming", lede: "Words that carry weight. Positioning first, then every line on the page.", cat: "copy" },
];

export const CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "web", label: "Web" },
  { slug: "uiux", label: "UI/UX" },
  { slug: "graphics", label: "Graphics" },
  { slug: "security", label: "Security" },
  { slug: "3d", label: "3D" },
  { slug: "video", label: "Video" },
  { slug: "ai", label: "AI" },
  { slug: "copy", label: "Copy" },
];

export const SEED_TESTIMONIALS = [
  { quote: "They designed it, built it, secured it and wrote it. One invoice, one point of contact, no finger-pointing when something needed fixing.", name: "Amara E.", role: "Head of Product, Novalend" },
  { quote: "The first agency that pushed back on our brief. They were right, and the site is better for it.", name: "Dario M.", role: "Founder, Atelier Noir" },
  { quote: "We got 26 hours a week back. That is a full-time hire we did not have to make.", name: "Lena K.", role: "Ops Lead, Flowstate" },
];

export const TEAM = [
  { name: "Terence", role: "Founder / Design & Build", bio: "Sets the standard, runs the room, still writes code on every project." },
  { name: "Open Seat", role: "Product Designer", bio: "For someone who thinks in systems and argues about spacing." },
  { name: "Open Seat", role: "Security Engineer", bio: "For someone who breaks things carefully and documents it well." },
  { name: "Open Seat", role: "Motion & 3D", bio: "For someone who can make a still frame feel like it is about to move." },
];

type SeedProject = {
  slug: string;
  name: string;
  cats: string;
  catLabel: string;
  year: string;
  client: string;
  role: string;
  heroImageUrl: string;
  intro: string;
  sections: ProjectSection[];
  links: ProjectLink[];
  featured: boolean;
};

const CDN = "https://d2ol7oe51mr4n9.cloudfront.net/user_3I90NgizzgjlxuNMaWCewcniSuv";

export const SEED_PROJECTS: SeedProject[] = [
  {
    slug: "novalend", name: "Novalend", cats: "web uiux", catLabel: "Web / UI-UX", year: "2026", client: "Novalend", role: "Design & Build",
    heroImageUrl: `${CDN}/2f7f4b6d-636a-42e2-8fa5-dd82d3b4e417.webp`,
    intro: "A lending platform for small businesses that needed to feel like a bank without behaving like one.",
    sections: [
      { heading: "The challenge", body: "Novalend had a working product and a 4-step application that 61% of users abandoned. The interface asked for everything up front and explained nothing. Trust signals were buried below the fold." },
      { heading: "Our approach", body: "We rebuilt the application as a progressive flow: three screens, each asking only for what it needs, with a live eligibility indicator that updates as you type. The marketing site was rewritten around a single promise and one number. Design system delivered in Figma and shipped as a component library." },
      { heading: "The outcome", body: "Application completion up 43%. Time to first offer down from 6 minutes to 90 seconds. The team now ships new product pages without design involvement.", bold: true },
    ],
    links: [], featured: true,
  },
  {
    slug: "atelier-noir", name: "Atelier Noir", cats: "uiux web graphics", catLabel: "UI-UX / Web", year: "2026", client: "Atelier Noir", role: "Identity & Commerce",
    heroImageUrl: `${CDN}/865add55-b142-45f9-a60e-1fba60dd093d.webp`,
    intro: "An independent fashion house moving from wholesale to direct, with an editorial voice worth protecting.",
    sections: [
      { heading: "The challenge", body: "The existing storefront was a stock theme. Product photography was strong, the interface flattened it. Every collection drop needed a developer." },
      { heading: "Our approach", body: "A full-bleed editorial commerce layout where imagery leads and chrome disappears. Type set large, navigation reduced to four items, cart as a quiet drawer. We built collection pages as CMS-driven blocks so the team can compose a drop in an afternoon." },
      { heading: "The outcome", body: "Average order value up 28%. Collection pages now go live same-day. Bounce rate on drop pages halved.", bold: true },
    ],
    links: [], featured: true,
  },
  {
    slug: "sentinel-bank", name: "Sentinel Bank", cats: "security web", catLabel: "Cybersecurity / Web", year: "2025", client: "Sentinel", role: "Security & Hardening",
    heroImageUrl: `${CDN}/a58e1f53-9192-4481-bcb3-461b6801555b.webp`,
    intro: "A regional bank preparing for audit with six months of unreviewed releases behind it.",
    sections: [
      { heading: "The challenge", body: "Rapid feature shipping had outpaced review. No threat model existed, access control was inconsistent across three services, and secrets were being passed through CI logs." },
      { heading: "Our approach", body: "Threat model workshop, then a manual penetration test across auth, session handling and business logic. We found 19 issues, four critical. Each came with reproduction steps and a patch. We then added security gates to CI and paired with their team on the fixes." },
      { heading: "The outcome", body: "All critical and high findings closed in three weeks. Audit passed first attempt. Security checks now block merge automatically.", bold: true },
    ],
    links: [], featured: true,
  },
  {
    slug: "kinetic-kicks", name: "Kinetic Kicks", cats: "3d video", catLabel: "3D / Video", year: "2025", client: "Kinetic", role: "3D & Motion",
    heroImageUrl: `${CDN}/58f272f3-3e1c-4b0f-87b7-46a0bbf779f8.webp`,
    intro: "A sneaker launch with no product in hand and a campaign date already sold to retail.",
    sections: [
      { heading: "The challenge", body: "Manufacturing samples were eight weeks out. The campaign needed hero stills, social cutdowns and a configurator for a shoe that physically did not exist yet." },
      { heading: "Our approach", body: "We modelled the shoe from CAD, developed materials against fabric swatches, and built a lighting rig that matched the brand's studio look. The same asset was compressed to 2.1MB glTF and shipped as a real-time configurator with four colourways." },
      { heading: "The outcome", body: "Campaign shipped on the original date. 4 colourways rendered in 6 days. The configurator held 60fps on mid-range mobile.", bold: true },
    ],
    links: [], featured: true,
  },
  {
    slug: "northfield", name: "Northfield", cats: "graphics copy", catLabel: "Graphics / Copy", year: "2025", client: "Northfield Supply", role: "Identity & Messaging",
    heroImageUrl: `${CDN}/176e8f83-79e7-47a6-9746-3ac130a78c6b.webp`,
    intro: "A 40-year-old supply company that had accumulated five logos and no rules.",
    sections: [
      { heading: "The challenge", body: "Every regional office had drifted into its own identity. Vendors were guessing at colour. Nothing was documented and the founder's original mark had genuine equity worth keeping." },
      { heading: "Our approach", body: "We audited every asset in circulation, kept the bones of the original mark and rebuilt it for small sizes and single-colour print. New type scale, a tightened palette, and templates for the twelve items they actually produce. Messaging rewritten around service radius rather than product range." },
      { heading: "The outcome", body: "One identity across nine offices. Print vendor errors down to zero. Guidelines adopted without a single follow-up request.", bold: true },
    ],
    links: [], featured: false,
  },
  {
    slug: "flowstate", name: "Flowstate", cats: "ai web", catLabel: "AI Automation / Web", year: "2026", client: "Flowstate", role: "Automation & Build",
    heroImageUrl: `${CDN}/0f4e24dc-dda6-4ee6-9089-83b47c28c759.webp`,
    intro: "An operations team spending 30 hours a week moving information between four tools.",
    sections: [
      { heading: "The challenge", body: "Intake arrived by email, was retyped into a tracker, summarised into a doc, then pasted into Slack. Four handoffs, four chances to lose something, and no audit trail when it went wrong." },
      { heading: "Our approach", body: "We mapped the workflow and automated the three highest-cost steps: classification, extraction and routing. Every run logs its inputs and confidence, low-confidence cases route to a human queue, and anything can be replayed. Built with a rollback and a named owner on their side." },
      { heading: "The outcome", body: "26 hours a week returned to the team. 94% classification accuracy with human review on the rest. Zero silent failures in four months.", bold: true },
    ],
    links: [], featured: false,
  },
];

export const SEED_POSTS = [
  {
    slug: "how-much-should-a-website-cost",
    title: "How much should a website cost in 2026?",
    excerpt:
      "The honest answer: it depends on four things. Here is how agencies actually price a site, and how to tell a fair quote from a padded one.",
    body: `Every agency dodges this question. We would rather not.

Price is not arbitrary. It is a function of four variables, and once you know them you can read any quote in about thirty seconds.

## 1. How many unique page designs

A five-page marketing site and a five-template product site sound identical. They are not. Templates multiply value because they multiply reuse.

## 2. Who writes the words

Copy is half the cost of a good site and the first thing quietly cut from a cheap quote. If the proposal does not mention copy, you are writing it.

## 3. What happens after launch

A site that cannot be edited without a developer is a subscription you never agreed to. Insist on a CMS your team can actually operate — we build every project on one for exactly this reason.

## 4. Whether security is included or invoiced later

An audit after launch costs more than hardening during the build. Ask which one the quote assumes.

## The honest ranges

- **A focused marketing site:** \\$3,000–8,000
- **A site with a CMS and blog:** \\$5,000–12,000
- **A product or e-commerce build:** \\$10,000 and up

Anything dramatically below these ranges is a template with your logo on it. Anything above should come with a very good reason — and a good agency will enjoy explaining it.`,
    coverUrl: "",
    tags: "web pricing strategy",
    published: true,
    publishedAt: new Date("2026-09-08T09:00:00Z"),
    seoTitle: "",
    seoDescription:
      "What agencies actually charge for a website in 2026, the four variables that drive the price, and how to read a quote in thirty seconds.",
  },
];

let seeded = false;

async function countRows(table: any): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return count;
}

/* Seeds every empty table once. Runs lazily on first site load, so a fresh
   database becomes a working site without a separate import step. */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  try {
    if ((await countRows(projects)) === 0) {
      let order = 0;
      for (const p of SEED_PROJECTS) {
        await db.insert(projects).values({ ...p, sortOrder: order++ }).onConflictDoNothing();
      }
    }
    if ((await countRows(services)) === 0) {
      let order = 0;
      for (const s of SEED_SERVICES) {
        await db.insert(services).values({ ...s, sortOrder: order++ }).onConflictDoNothing();
      }
    }
    if ((await countRows(testimonials)) === 0) {
      let order = 0;
      for (const t of SEED_TESTIMONIALS) {
        await db.insert(testimonials).values({ ...t, sortOrder: order++ }).onConflictDoNothing();
      }
    }
    if ((await countRows(posts)) === 0) {
      for (const p of SEED_POSTS) {
        await db.insert(posts).values(p).onConflictDoNothing();
      }
    }
    seeded = true;
  } catch (e) {
    console.error(
      "[r208] Seeding failed — has the database been migrated? Run: npm run db:migrate",
      e
    );
  }
}

export async function getPublishedProjects(): Promise<Project[]> {
  await ensureSeeded();
  return db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.sortOrder), asc(projects.id));
}

export async function getServices(): Promise<Service[]> {
  await ensureSeeded();
  return db
    .select()
    .from(services)
    .where(eq(services.published, true))
    .orderBy(asc(services.sortOrder), asc(services.id));
}

export async function getTestimonials(): Promise<Testimonial[]> {
  await ensureSeeded();
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.published, true))
    .orderBy(asc(testimonials.sortOrder), asc(testimonials.id));
}

export async function getPublishedPosts(): Promise<Post[]> {
  await ensureSeeded();
  return db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt), desc(posts.id));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  await ensureSeeded();
  const [row] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  return row && row.published ? row : null;
}

import { db } from "@/db";
import { projects } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { ensureSeeded } from "@/lib/site-data";
import { asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  await ensureSeeded();
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      catLabel: projects.catLabel,
      year: projects.year,
      heroImageUrl: projects.heroImageUrl,
      featured: projects.featured,
      published: projects.published,
      sortOrder: projects.sortOrder,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(asc(projects.sortOrder), asc(projects.id));
  return Response.json(rows);
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = (body.name || "Untitled project").trim() || "Untitled project";

  let base = slugify(name);
  let slug = base;
  let n = 1;
  // ensure unique slug
  while (
    (await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1))
      .length > 0
  ) {
    slug = `${base}-${++n}`;
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(sort_order), -1)::int` })
    .from(projects);

  const [row] = await db
    .insert(projects)
    .values({
      slug,
      name,
      cats: "web",
      catLabel: "Web",
      year: String(new Date().getFullYear()),
      sections: [
        { heading: "The challenge", body: "" },
        { heading: "Our approach", body: "" },
        { heading: "The outcome", body: "", bold: true },
      ],
      links: [],
      sortOrder: max + 1,
      published: false,
    })
    .returning();
  return Response.json(row, { status: 201 });
}

/* PATCH: reorder — body { ids: number[] } in the desired order */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { ids?: number[] };
  if (!Array.isArray(body.ids)) {
    return Response.json({ error: "ids array required" }, { status: 400 });
  }
  let order = 0;
  for (const id of body.ids) {
    await db
      .update(projects)
      .set({ sortOrder: order++, updatedAt: new Date() })
      .where(eq(projects.id, Number(id)));
  }
  return Response.json({ ok: true });
}

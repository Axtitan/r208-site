import { db } from "@/db";
import { projectAssets, projects, type ProjectLink, type ProjectSection } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { isSafeUrl } from "@/lib/render";
import { asc, eq, and, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function loadProject(id: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;
  const assets = await db
    .select({
      id: projectAssets.id,
      kind: projectAssets.kind,
      filename: projectAssets.filename,
      mimeType: projectAssets.mimeType,
      size: projectAssets.size,
      caption: projectAssets.caption,
      sortOrder: projectAssets.sortOrder,
    })
    .from(projectAssets)
    .where(eq(projectAssets.projectId, id))
    .orderBy(asc(projectAssets.sortOrder), asc(projectAssets.id));
  return { ...project, assets };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const data = await loadProject(Number(id));
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const projectId = Number(id);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);

  const update: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };

  if (str("name") !== undefined) update.name = str("name")!.trim() || "Untitled project";
  if (str("year") !== undefined) update.year = str("year")!.trim();
  if (str("client") !== undefined) update.client = str("client")!.trim();
  if (str("role") !== undefined) update.role = str("role")!.trim();
  if (str("catLabel") !== undefined) update.catLabel = str("catLabel")!.trim();
  if (str("cats") !== undefined) update.cats = str("cats")!.trim();
  if (str("heroImageUrl") !== undefined) {
    const url = str("heroImageUrl")!.trim();
    if (!isSafeUrl(url)) {
      return Response.json(
        { error: "Hero image URL must start with https:// (or be an uploaded file)." },
        { status: 400 }
      );
    }
    update.heroImageUrl = url;
  }
  if (str("heroVideoUrl") !== undefined) {
    const url = str("heroVideoUrl")!.trim();
    if (!isSafeUrl(url) || (url && !/\.(mp4|webm)(\?.*)?$/i.test(url))) {
      return Response.json(
        { error: "Hero video must be an .mp4 or .webm link starting with https:// or /" },
        { status: 400 }
      );
    }
    update.heroVideoUrl = url;
  }
  if (str("intro") !== undefined) update.intro = str("intro")!;
  if (typeof body.featured === "boolean") update.featured = body.featured;
  if (typeof body.published === "boolean") update.published = body.published;

  if (Array.isArray(body.sections)) {
    update.sections = (body.sections as ProjectSection[])
      .filter((s) => s && typeof s.heading === "string" && typeof s.body === "string")
      .map((s) => ({ heading: s.heading, body: s.body, bold: !!s.bold }));
  }
  if (Array.isArray(body.links)) {
    update.links = (body.links as ProjectLink[])
      .filter((l) => l && typeof l.label === "string" && typeof l.url === "string")
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label || l.url);
    const bad = update.links.find((l) => !isSafeUrl(l.url, { allowMailto: true }));
    if (bad) {
      return Response.json(
        { error: `Link "${bad.label || bad.url}" must start with https://, http:// or mailto:` },
        { status: 400 }
      );
    }
  }

  if (str("slug") !== undefined) {
    const wanted = slugify(str("slug")!);
    const clash = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.slug, wanted), ne(projects.id, projectId)))
      .limit(1);
    if (clash.length > 0) {
      return Response.json({ error: `Slug "${wanted}" is already in use` }, { status: 409 });
    }
    update.slug = wanted;
  }

  const [row] = await db
    .update(projects)
    .set(update)
    .where(eq(projects.id, projectId))
    .returning();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const data = await loadProject(projectId);
  return Response.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, Number(id)));
  return Response.json({ ok: true });
}

import { db } from "@/db";
import { projectAssets, projects } from "@/db/schema";
import { ensureSeeded, getPublishedProjects } from "@/lib/site-data";
import { renderProjectPage } from "@/lib/render";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await ensureSeeded();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project || !project.published) {
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/projects.html"></head><body></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const assets = await db
    .select({
      id: projectAssets.id,
      kind: projectAssets.kind,
      filename: projectAssets.filename,
      mimeType: projectAssets.mimeType,
      size: projectAssets.size,
      caption: projectAssets.caption,
    })
    .from(projectAssets)
    .where(eq(projectAssets.projectId, project.id))
    .orderBy(asc(projectAssets.sortOrder), asc(projectAssets.id));

  const all = await getPublishedProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  const next =
    all.length > 1 && idx >= 0
      ? { slug: all[(idx + 1) % all.length].slug, name: all[(idx + 1) % all.length].name }
      : null;

  return new Response(renderProjectPage(project, assets, next), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

import { db } from "@/db";
import { projectAssets, projects } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Vercel Hobby caps request bodies at ~4.5 MB — stay under it.
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const projectId = Number(id);

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Expected multipart form data" }, { status: 400 });

  const file = form.get("file");
  const kind = String(form.get("kind") || "image");
  const caption = String(form.get("caption") || "");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File too large (max 4 MB on the free tier — compress it first)" }, { status: 413 });
  }
  if (!["image", "file", "hero"].includes(kind)) {
    return Response.json({ error: "Invalid kind" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(sort_order), -1)::int` })
    .from(projectAssets)
    .where(eq(projectAssets.projectId, projectId));

  const [row] = await db
    .insert(projectAssets)
    .values({
      projectId,
      kind: kind === "hero" ? "hero" : kind,
      filename: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      caption,
      sortOrder: max + 1,
      data: buf,
    })
    .returning({
      id: projectAssets.id,
      kind: projectAssets.kind,
      filename: projectAssets.filename,
      mimeType: projectAssets.mimeType,
      size: projectAssets.size,
      caption: projectAssets.caption,
      sortOrder: projectAssets.sortOrder,
    });

  // A "hero" upload also becomes the project's hero image.
  if (kind === "hero") {
    await db
      .update(projects)
      .set({ heroImageUrl: `/api/files/${row.id}`, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
  }

  return Response.json({ ...row, url: `/api/files/${row.id}` }, { status: 201 });
}

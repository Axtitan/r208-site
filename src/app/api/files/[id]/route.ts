import { db } from "@/db";
import { projectAssets, projects } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { isInlineSafe, safeFilename } from "@/lib/uploads";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isInteger(assetId)) {
    return new Response("Not found", { status: 404 });
  }

  const [asset] = await db
    .select({
      filename: projectAssets.filename,
      mimeType: projectAssets.mimeType,
      data: projectAssets.data,
      published: projects.published,
    })
    .from(projectAssets)
    .innerJoin(projects, eq(projects.id, projectAssets.projectId))
    .where(eq(projectAssets.id, assetId))
    .limit(1);

  // Files on draft projects are only visible to the signed-in admin.
  if (!asset || (!asset.published && !(await isAdmin()))) {
    return new Response("Not found", { status: 404 });
  }

  const name = safeFilename(asset.filename);
  // Older uploads weren't type-checked, so anything that isn't a known
  // raster image is forced to download rather than render on this origin.
  const inline = isInlineSafe(asset.mimeType) && new URL(req.url).searchParams.get("download") !== "1";

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "content-type": inline ? asset.mimeType : "application/octet-stream",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "x-content-type-options": "nosniff",
      // Even if a file is opened directly, it gets no script and no same-origin access.
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "cache-control": asset.published
        ? "public, max-age=86400, s-maxage=86400"
        : "private, no-store",
    },
  });
}

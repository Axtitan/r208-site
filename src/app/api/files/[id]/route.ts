import { db } from "@/db";
import { projectAssets } from "@/db/schema";
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
    .select()
    .from(projectAssets)
    .where(eq(projectAssets.id, assetId))
    .limit(1);

  if (!asset) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const disposition = download
    ? `attachment; filename="${asset.filename.replace(/"/g, "")}"`
    : `inline; filename="${asset.filename.replace(/"/g, "")}"`;

  const bytes = new Uint8Array(asset.data);
  return new Response(bytes, {
    headers: {
      "content-type": asset.mimeType || "application/octet-stream",
      "content-disposition": disposition,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

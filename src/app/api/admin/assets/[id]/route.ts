import { db } from "@/db";
import { projectAssets } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { caption?: string };
  const [row] = await db
    .update(projectAssets)
    .set({ caption: typeof body.caption === "string" ? body.caption : "" })
    .where(eq(projectAssets.id, Number(id)))
    .returning({ id: projectAssets.id, caption: projectAssets.caption });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await db.delete(projectAssets).where(eq(projectAssets.id, Number(id)));
  return Response.json({ ok: true });
}

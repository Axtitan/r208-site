import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/* PATCH: mark read/unread — body { read: boolean } */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { read?: unknown };
  if (typeof body.read !== "boolean") {
    return Response.json({ error: "read must be true or false" }, { status: 400 });
  }
  const [row] = await db
    .update(enquiries)
    .set({ read: body.read })
    .where(eq(enquiries.id, Number(id) || 0))
    .returning({ id: enquiries.id, read: enquiries.read });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await db.delete(enquiries).where(eq(enquiries.id, Number(id) || 0));
  return Response.json({ ok: true });
}

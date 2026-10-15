import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { isAdmin, unauthorized } from "@/lib/auth";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await db
    .select({
      id: enquiries.id,
      name: enquiries.name,
      email: enquiries.email,
      company: enquiries.company,
      service: enquiries.service,
      budget: enquiries.budget,
      message: enquiries.message,
      read: enquiries.read,
      createdAt: enquiries.createdAt,
    })
    .from(enquiries)
    .orderBy(desc(enquiries.createdAt), desc(enquiries.id))
    .limit(500);
  return Response.json(rows);
}

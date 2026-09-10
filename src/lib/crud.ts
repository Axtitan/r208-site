import { db } from "@/db";
import { isAdmin, unauthorized } from "@/lib/auth";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

/* Generic admin CRUD for simple collections (services, testimonials, posts).
   One config produces GET/POST/PATCH (list route) and GET_ONE/PUT/DELETE_ONE
   (item route). Projects keep their bespoke routes because of asset uploads. */

export type CrudField = {
  key: string;
  type: "text" | "textarea" | "boolean" | "slug" | "datetime";
  required?: boolean;
  max?: number;
};

export type CrudConfig = {
  label: string;
  table: any; // drizzle table
  fields: CrudField[];
  slug?: { field: string; from: string };
  reorderable?: boolean;
  orderByRecent?: string; // column key, e.g. "publishedAt"
  nowOnPublish?: boolean; // set publishedAt=now when published without a date
  createTemplate?: Record<string, unknown>;
};

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function buildValues(
  cfg: CrudConfig,
  body: Record<string, unknown>,
  partial: boolean
): { values?: Record<string, unknown>; error?: string } {
  const values: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const raw = body[f.key];
    if (raw === undefined) {
      if (!partial) {
        if (f.type === "boolean") values[f.key] = false;
        else if (f.type === "datetime") values[f.key] = null;
        else values[f.key] = "";
      }
      continue;
    }
    if (f.type === "boolean") {
      if (typeof raw !== "boolean") return { error: `${f.key} must be true or false` };
      values[f.key] = raw;
    } else if (f.type === "datetime") {
      if (raw === null || raw === "") {
        values[f.key] = null;
      } else {
        const d = new Date(String(raw));
        if (isNaN(d.getTime())) return { error: `${f.key} is not a valid date` };
        values[f.key] = d;
      }
    } else {
      if (typeof raw !== "string") return { error: `${f.key} must be text` };
      const v = f.type === "slug" ? slugify(raw) : f.type === "text" ? raw.trim() : raw;
      if (f.max && v.length > f.max)
        return { error: `${f.key} is too long (max ${f.max} characters)` };
      if (f.required && !v) return { error: `${f.key} is required` };
      values[f.key] = v;
    }
  }
  return { values };
}

async function uniqueSlug(
  table: any,
  slugField: string,
  wanted: string,
  excludeId?: number
): Promise<string> {
  const base = wanted || "item";
  let slug = base;
  let n = 1;
  for (;;) {
    const cond = excludeId
      ? and(eq(table[slugField], slug), ne(table.id, excludeId))
      : eq(table[slugField], slug);
    const rows = await db.select({ id: table.id }).from(table).where(cond).limit(1);
    if (rows.length === 0) return slug;
    slug = `${base}-${++n}`;
  }
}

export function makeCrud(cfg: CrudConfig) {
  const table = cfg.table;
  const orderClause = cfg.reorderable
    ? [asc(table.sortOrder), asc(table.id)]
    : cfg.orderByRecent
      ? [desc(table[cfg.orderByRecent]), desc(table.id)]
      : [asc(table.id)];

  async function GET() {
    if (!(await isAdmin())) return unauthorized();
    const rows = await db.select().from(table).orderBy(...orderClause);
    return Response.json(rows);
  }

  async function POST(req: Request) {
    if (!(await isAdmin())) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const built = buildValues(cfg, body, false);
    if (built.error) return Response.json({ error: built.error }, { status: 400 });
    const values: Record<string, unknown> = {
      ...(cfg.createTemplate || {}),
      ...built.values,
    };
    if (cfg.slug) {
      const fromVal = String(values[cfg.slug.from] || body[cfg.slug.from] || cfg.label);
      values[cfg.slug.field] = await uniqueSlug(table, cfg.slug.field, slugify(fromVal));
    }
    if (cfg.reorderable) {
      const [{ max }] = await db
        .select({ max: sql<number>`coalesce(max(sort_order), -1)::int` })
        .from(table);
      values.sortOrder = max + 1;
    }
    if (cfg.nowOnPublish && values.published && !values.publishedAt) {
      values.publishedAt = new Date();
    }
    const [row] = await db.insert(table).values(values).returning();
    return Response.json(row, { status: 201 });
  }

  /* PATCH: reorder — body { ids: number[] } in the desired order */
  async function PATCH(req: Request) {
    if (!(await isAdmin())) return unauthorized();
    if (!cfg.reorderable)
      return Response.json({ error: "Not reorderable" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as { ids?: number[] };
    if (!Array.isArray(body.ids))
      return Response.json({ error: "ids array required" }, { status: 400 });
    let order = 0;
    for (const id of body.ids) {
      await db
        .update(table)
        .set({ sortOrder: order++ })
        .where(eq(table.id, Number(id)));
    }
    return Response.json({ ok: true });
  }

  async function GET_ONE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    if (!(await isAdmin())) return unauthorized();
    const { id } = await params;
    const [row] = await db.select().from(table).where(eq(table.id, Number(id))).limit(1);
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(row);
  }

  async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    if (!(await isAdmin())) return unauthorized();
    const { id } = await params;
    const rowId = Number(id);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object")
      return Response.json({ error: "Invalid body" }, { status: 400 });
    const built = buildValues(cfg, body, true);
    if (built.error) return Response.json({ error: built.error }, { status: 400 });
    const update: Record<string, unknown> = { ...built.values };
    if (cfg.slug && update[cfg.slug.field] !== undefined) {
      update[cfg.slug.field] = await uniqueSlug(
        table,
        cfg.slug.field,
        String(update[cfg.slug.field]),
        rowId
      );
    }
    if (cfg.nowOnPublish && update.published === true) {
      const [current] = await db.select().from(table).where(eq(table.id, rowId)).limit(1);
      if (current && !current.publishedAt && update.publishedAt === undefined) {
        update.publishedAt = new Date();
      }
    }
    update.updatedAt = new Date();
    const [row] = await db.update(table).set(update).where(eq(table.id, rowId)).returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(row);
  }

  async function DELETE_ONE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    if (!(await isAdmin())) return unauthorized();
    const { id } = await params;
    await db.delete(table).where(eq(table.id, Number(id)));
    return Response.json({ ok: true });
  }

  return { GET, POST, PATCH, GET_ONE, PUT, DELETE_ONE };
}

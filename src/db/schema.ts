import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export type ProjectSection = {
  heading: string;
  body: string;
  bold?: boolean;
};

export type ProjectLink = {
  label: string;
  url: string;
};

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  cats: text("cats").notNull().default(""),
  catLabel: text("cat_label").notNull().default(""),
  year: text("year").notNull().default("2026"),
  client: text("client").notNull().default(""),
  role: text("role").notNull().default(""),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  intro: text("intro").notNull().default(""),
  sections: jsonb("sections").$type<ProjectSection[]>().notNull().default([]),
  links: jsonb("links").$type<ProjectLink[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectAssets = pgTable("project_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("image"), // 'image' | 'file' | 'hero'
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull().default(0),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  num: text("num").notNull().default("01"),
  name: text("name").notNull(),
  tags: text("tags").notNull().default(""),
  lede: text("lede").notNull().default(""),
  cat: text("cat").notNull().default("web"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull().default(""),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""), // Markdown
  coverUrl: text("cover_url").notNull().default(""),
  tags: text("tags").notNull().default(""), // space-separated
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* One row per rate-limited action (login attempt, contact submission).
   `bucket` names the limit, `key` is usually the client IP (or "*" for a
   site-wide cap). Rows older than 24h are pruned. */
export const rateEvents = pgTable("rate_events", {
  id: serial("id").primaryKey(),
  bucket: text("bucket").notNull(),
  key: text("key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* Admin sessions. The cookie holds a random token; only its SHA-256 is stored,
   so a database leak does not hand out working sessions. */
export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(), // sha256(token), hex
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

/* Contact-form submissions from contact.html. */
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  service: text("service").notNull().default(""),
  budget: text("budget").notNull().default(""),
  message: text("message").notNull(),
  ip: text("ip").notNull().default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type ProjectAsset = typeof projectAssets.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;

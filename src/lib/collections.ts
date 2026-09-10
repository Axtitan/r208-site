import { posts, services, testimonials } from "@/db/schema";
import { makeCrud } from "./crud";

/* Server-side CRUD configs. The admin UI mirrors these in collection-config.ts. */

export const serviceCrud = makeCrud({
  label: "service",
  table: services,
  slug: { field: "slug", from: "name" },
  reorderable: true,
  fields: [
    { key: "name", type: "text", required: true, max: 120 },
    { key: "slug", type: "slug" },
    { key: "num", type: "text", max: 4 },
    { key: "cat", type: "text", max: 40 },
    { key: "tags", type: "text", max: 200 },
    { key: "lede", type: "textarea", max: 600 },
    { key: "published", type: "boolean" },
  ],
});

export const testimonialCrud = makeCrud({
  label: "testimonial",
  table: testimonials,
  reorderable: true,
  fields: [
    { key: "quote", type: "textarea", required: true, max: 600 },
    { key: "name", type: "text", required: true, max: 120 },
    { key: "role", type: "text", max: 160 },
    { key: "published", type: "boolean" },
  ],
});

export const postCrud = makeCrud({
  label: "post",
  table: posts,
  slug: { field: "slug", from: "title" },
  orderByRecent: "publishedAt",
  nowOnPublish: true,
  fields: [
    { key: "title", type: "text", required: true, max: 200 },
    { key: "slug", type: "slug" },
    { key: "excerpt", type: "textarea", max: 400 },
    { key: "body", type: "textarea" },
    { key: "coverUrl", type: "text", max: 500 },
    { key: "tags", type: "text", max: 200 },
    { key: "publishedAt", type: "datetime" },
    { key: "published", type: "boolean" },
    { key: "seoTitle", type: "text", max: 200 },
    { key: "seoDescription", type: "textarea", max: 300 },
  ],
});

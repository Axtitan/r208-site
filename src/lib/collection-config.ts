/* Client-safe admin UI configs. Mirrors src/lib/collections.ts (server). */

export type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "select" | "datetime";
  required?: boolean;
  placeholder?: string;
  help?: string;
  rows?: number;
  options?: { value: string; label: string }[];
};

export type CollectionConfig = {
  key: string;
  title: string;
  singular: string;
  apiPath: string;
  adminPath: string;
  titleField: string;
  metaFields: string[];
  reorderable: boolean;
  createLabel: string;
  description: string;
  viewPath?: (row: Record<string, any>) => string;
  fields: FieldConfig[];
};

const CAT_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "uiux", label: "UI/UX" },
  { value: "graphics", label: "Graphics" },
  { value: "security", label: "Security" },
  { value: "3d", label: "3D" },
  { value: "video", label: "Video" },
  { value: "ai", label: "AI" },
  { value: "copy", label: "Copy" },
];

export const COLLECTIONS: Record<string, CollectionConfig> = {
  services: {
    key: "services",
    title: "Services",
    singular: "service",
    apiPath: "/api/admin/services",
    adminPath: "/admin/services",
    titleField: "name",
    metaFields: ["num", "cat"],
    reorderable: true,
    createLabel: "+ New service",
    description:
      "The service rows shown across the site. Order here is the order on the site. Detail pages (service-*.html) are still static files — ask before editing those.",
    viewPath: (r) => `/service-${r.slug}.html`,
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "URL slug", type: "text", help: "Used in service-<slug>.html links" },
      { key: "num", label: "Number", type: "text", placeholder: "01" },
      { key: "cat", label: "Category", type: "select", options: CAT_OPTIONS },
      { key: "tags", label: "Tags", type: "text", placeholder: "Marketing sites / Web apps / Headless CMS" },
      { key: "lede", label: "Lede", type: "textarea", rows: 3 },
      { key: "published", label: "Published (visible on the site)", type: "checkbox" },
    ],
  },
  testimonials: {
    key: "testimonials",
    title: "Testimonials",
    singular: "testimonial",
    apiPath: "/api/admin/testimonials",
    adminPath: "/admin/testimonials",
    titleField: "name",
    metaFields: ["role"],
    reorderable: true,
    createLabel: "+ New testimonial",
    description: "Client quotes shown in the homepage testimonial slideshow.",
    fields: [
      { key: "quote", label: "Quote", type: "textarea", rows: 4, required: true },
      { key: "name", label: "Person", type: "text", required: true, placeholder: "Amara E." },
      { key: "role", label: "Role / Company", type: "text", placeholder: "Head of Product, Novalend" },
      { key: "published", label: "Published (visible on the site)", type: "checkbox" },
    ],
  },
  posts: {
    key: "posts",
    title: "Journal",
    singular: "post",
    apiPath: "/api/admin/posts",
    adminPath: "/admin/posts",
    titleField: "title",
    metaFields: ["slug", "tags"],
    reorderable: false,
    createLabel: "+ New post",
    description:
      "Blog articles published at /journal — your SEO engine. The body supports Markdown (## headings, **bold**, *italic*, - lists, [links](https://…), `code`).",
    viewPath: (r) => `/journal/${r.slug}`,
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "URL slug", type: "text", help: "/journal/<slug>" },
      { key: "excerpt", label: "Excerpt", type: "textarea", rows: 2, help: "Shown on the journal index and used as meta description fallback" },
      { key: "body", label: "Body (Markdown)", type: "textarea", rows: 16 },
      { key: "coverUrl", label: "Cover image URL", type: "text", placeholder: "https://… (optional)" },
      { key: "tags", label: "Tags", type: "text", placeholder: "web security seo" },
      { key: "publishedAt", label: "Publish date", type: "datetime", help: "Defaults to the moment you first publish" },
      { key: "published", label: "Published (live at /journal)", type: "checkbox" },
      { key: "seoTitle", label: "SEO title (optional)", type: "text", help: "Overrides the browser title for search engines" },
      { key: "seoDescription", label: "SEO description (optional)", type: "textarea", rows: 2 },
    ],
  },
};

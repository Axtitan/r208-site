import Link from "next/link";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/admin/projects",
    title: "Projects",
    desc: "Case studies on the homepage, the projects grid and every project-*.html page. Includes image & file uploads.",
  },
  {
    href: "/admin/services",
    title: "Services",
    desc: "The service rows shown across the site. Detail pages are still static files.",
  },
  {
    href: "/admin/testimonials",
    title: "Testimonials",
    desc: "Client quotes in the homepage slideshow.",
  },
  {
    href: "/admin/posts",
    title: "Journal",
    desc: "Blog articles for SEO, published at /journal. Markdown supported.",
  },
];

export default function AdminHome() {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#8a8a84]">Dashboard</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Content</h1>
      <p className="mb-10 max-w-xl text-sm text-[#8a8a84]">
        Everything saved here goes live on the site immediately — drafts stay hidden until
        published.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group border border-[#2a2a27] bg-[#111110] p-6 transition hover:border-[#D6FF4B]"
          >
            <h2 className="mb-2 text-lg font-bold tracking-tight group-hover:text-[#D6FF4B]">
              {s.title} →
            </h2>
            <p className="text-sm text-[#8a8a84]">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import type { Project } from "@/db/schema";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AssetMeta = {
  id: number;
  kind: string;
  filename: string;
  mimeType: string;
  size: number;
  caption: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const BRAND_SVG = `<svg width="34" height="23" viewBox="0 0 34 23" fill="none" aria-hidden="true"><rect width="10" height="10" fill="#F4F2EE"/><rect x="12" width="10" height="10" fill="#F4F2EE"/><rect x="24" width="10" height="10" fill="#D6FF4B"/><rect y="12" width="10" height="10" fill="#F4F2EE"/><rect x="12" y="12" width="10" height="10" fill="#F4F2EE"/><rect x="24" y="12" width="10" height="10" fill="#F4F2EE"/></svg>`;

const ARROW = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 1M13 1H4M13 1V10" stroke="#0B0B0A" stroke-width="1.5"/></svg>`;

export function renderProjectPage(
  p: Project,
  assets: AssetMeta[],
  next: { slug: string; name: string } | null
): string {
  const gallery = assets.filter((a) => a.kind === "image");
  const files = assets.filter((a) => a.kind === "file");

  const sectionsHtml = (p.sections || [])
    .map((s) => {
      const body = s.bold ? `<strong>${esc(s.body)}</strong>` : esc(s.body);
      return `<h2 data-reveal>${esc(s.heading)}</h2><p data-reveal>${body}</p>`;
    })
    .join("\n");

  const galleryHtml = gallery.length
    ? `<section class="section" style="padding-top:0"><div class="wrap"><div class="proj-gallery">` +
      gallery
        .map(
          (a) =>
            `<figure data-reveal><img src="/api/files/${a.id}" alt="${esc(a.caption || a.filename)}" loading="lazy">` +
            (a.caption ? `<figcaption class="label" style="margin-top:10px;color:var(--steel)">${esc(a.caption)}</figcaption>` : "") +
            `</figure>`
        )
        .join("") +
      `</div></div></section>`
    : "";

  const linksHtml = (p.links || []).length
    ? `<div class="proj-extra" data-reveal><div class="label m-label" style="margin-bottom:14px">Links</div><div style="display:flex;gap:12px;flex-wrap:wrap">` +
      (p.links || [])
        .map(
          (l) =>
            `<a class="cta-btn cta-btn--ghost" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)}</span></a>`
        )
        .join("") +
      `</div></div>`
    : "";

  const filesHtml = files.length
    ? `<div class="proj-extra" data-reveal><div class="label m-label" style="margin-bottom:14px">Downloads</div><div class="proj-files">` +
      files
        .map(
          (a) =>
            `<a class="proj-file" href="/api/files/${a.id}?download=1">` +
            `<span>${esc(a.caption || a.filename)}</span>` +
            `<span class="label" style="color:var(--steel)">${esc(a.filename)} · ${formatSize(a.size)}</span></a>`
        )
        .join("") +
      `</div></div>`
    : "";

  const extrasHtml =
    linksHtml || filesHtml
      ? `<div class="wrap"><div class="proj-body" style="padding-bottom:56px">${linksHtml}${filesHtml}</div></div>`
      : "";

  const nextHtml = next
    ? `<div class="wrap"><a class="next-proj" href="project-${esc(next.slug)}.html"><div><span class="label">Next project</span><div class="n-title">${esc(next.name)}</div></div><span class="round-arrow"><svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 1M13 1H4M13 1V10" stroke="#D6FF4B" stroke-width="1.5"/></svg></span></a></div>`
    : "";

  const heroMedia = p.heroImageUrl
    ? `<div class="proj-hero-media" data-reveal><img src="${esc(p.heroImageUrl)}" alt="${esc(p.name)}"></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} — R208 Technologies</title>
<meta name="description" content="${esc(p.intro)}">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0B0B0A">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="preload" href="assets/fonts/Geist-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Geist-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Geist-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"></noscript>
<script>(function(){try{if(localStorage.getItem('r208-theme')==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();</script>
<link rel="stylesheet" href="assets/css/style.css">
<style>
.proj-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:960px;margin:0 auto}
.proj-gallery figure{margin:0}
.proj-gallery img{width:100%;height:auto;display:block;background:var(--ink-2, #151513)}
@media (max-width:720px){.proj-gallery{grid-template-columns:1fr}}
.proj-extra{margin-top:40px;padding-top:32px;border-top:1px solid var(--line)}
.proj-files{display:flex;flex-direction:column;gap:10px}
.proj-file{display:flex;justify-content:space-between;gap:16px;align-items:baseline;padding:16px 18px;border:1px solid var(--line);color:var(--paper);text-decoration:none;transition:border-color .2s}
.proj-file:hover{border-color:var(--signal)}
</style>
<script>
(function(){var d=document.documentElement;setTimeout(function(){if(!d.classList.contains('js-ready'))d.classList.add('js-fallback');},3000);})();
</script>
<noscript><style>[data-reveal]{opacity:1!important;transform:none!important}.hero-title,.page-title{opacity:1!important}.hero-title .word>span,.page-title .word>span{transform:none!important}.preloader{display:none!important}</style></noscript>
</head>
<body>
<div class="preloader" aria-hidden="true"><div class="preloader-grid"><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
<header class="site-header">
<a class="brand" href="index.html">${BRAND_SVG}<span>R208<span class="reg">®</span></span></a>
<nav class="main-nav"><a class="nav-link" href="index.html">Home</a><a class="nav-link" href="about.html">About</a><a class="nav-link" href="services.html">Services</a><a class="nav-link is-active" href="projects.html">Projects</a><a class="nav-link" href="/journal">Journal</a><a class="nav-link" href="contact.html">Contact</a><a class="cta-btn" href="contact.html"><span>Start a project</span></a></nav>
<div class="header-side">
<button id="theme-toggle" aria-label="Toggle color theme" aria-pressed="false"><span class="tt-icon"></span></button>
<button class="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</div>
</header>
<main><section class="page-hero">
<div class="page-hero-ghost" aria-hidden="true">${esc(p.year)}</div>
<div class="wrap">
<div class="crumbs"><span class="label">R208</span><span class="label">Projects</span><span class="label">${esc(p.year)}</span></div>
<h1 class="page-title" data-split data-split-accent="">${esc(p.name)}</h1>
<p class="page-lede" data-reveal data-reveal-delay="1">${esc(p.intro)}</p>
</div>
</section><div class="wrap">${heroMedia}<div class="proj-meta"><div><div class="label m-label">Client</div><div>${esc(p.client)}</div></div><div><div class="label m-label">Year</div><div>${esc(p.year)}</div></div><div><div class="label m-label">Discipline</div><div>${esc(p.catLabel)}</div></div><div><div class="label m-label">Role</div><div>${esc(p.role)}</div></div></div></div><section class="section"><div class="wrap"><div class="proj-body">
${sectionsHtml}
</div></div></section>${galleryHtml}${extrasHtml}${nextHtml}<section class="section cta-band">
<div class="wrap">
<div class="section-kicker" data-reveal><i></i><span class="label">Next step</span></div>
<h2 class="big" data-reveal>Want results <span class="accent">like these?</span></h2>
<div style="display:flex;gap:16px;flex-wrap:wrap" data-reveal data-reveal-delay="1">
<a class="cta-btn" href="contact.html"><span>Start a project</span>${ARROW}</a>
<a class="cta-btn cta-btn--ghost" href="projects.html"><span>See the work</span></a>
</div>
</div>
</section></main>
<footer class="site-footer">
<div class="wrap">
<div class="footer-grid">
<div>
<a class="brand" href="index.html" style="margin-bottom:20px">${BRAND_SVG}<span>R208<span class="reg">®</span></span></a>
<p style="color:var(--steel);max-width:34ch">The room where it all gets made. A multidisciplinary agency building digital work end to end.</p>
</div>
<div><h4>Services</h4><a class="f-link" href="service-web-design-development.html">Web Design & Development</a><a class="f-link" href="service-ui-ux-design.html">UI/UX Design</a><a class="f-link" href="service-graphics-design.html">Graphics Design</a><a class="f-link" href="service-cybersecurity.html">Cybersecurity</a><a class="f-link" href="service-3d-design.html">3D Design</a><a class="f-link" href="services.html">All services</a></div>
<div><h4>Agency</h4><a class="f-link" href="about.html">About</a><a class="f-link" href="projects.html">Projects</a><a class="f-link" href="/journal">Journal</a><a class="f-link" href="contact.html">Contact</a></div>
<div><h4>Contact</h4><a class="f-link" href="mailto:r208technologies@gmail.com">r208technologies@gmail.com</a><span class="f-link" style="color:var(--steel)">Abuja / Remote</span></div>
</div>
<div class="footer-word">R208</div>
<div class="footer-base">
<span class="label">© <span data-year>2026</span> R208 Technologies</span>
<span class="label">We don't decorate. We build.</span>
</div>
</div>
</footer>
<script defer src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="assets/js/data.js"></script>
<script defer src="assets/js/main.js"></script>
</body>
</html>`;
}


/* ==================== Journal (blog) ==================== */

export type PostRow = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  tags: string;
  publishedAt: Date | string | null;
  seoTitle: string;
  seoDescription: string;
};

function fmtDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* Minimal, safe Markdown renderer: input is HTML-escaped first, then the
   supported syntax (headings, bold/italic, code, lists, http links) is
   converted. No raw HTML passes through. */
export function markdownToHtml(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let inCode = false;
  let code: string[] = [];

  const inline = (s: string): string =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      );

  const flushPara = () => {
    if (para.length) {
      out.push(`<p data-reveal>${para.map(inline).join(" ")}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const l = list;
      out.push(
        `<${l.type} data-reveal>${l.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${l.type}>`
      );
      list = null;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushPara();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const t = line.trim();
    if (!t) {
      flushPara();
      flushList();
      continue;
    }
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      const lvl = h[1].length + 1;
      out.push(`<h${lvl} data-reveal>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    const ul = t.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    const ol = t.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    para.push(t);
  }
  flushPara();
  flushList();
  if (inCode) out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  return out.join("\n");
}

const JOURNAL_STYLES = `<style>
.journal-list{display:flex;flex-direction:column}
.journal-row{display:grid;grid-template-columns:150px 1fr auto;gap:24px;align-items:baseline;padding:30px 24px;margin:0 -24px;border-top:1px solid var(--line);color:var(--paper);text-decoration:none;transition:background .25s}
.journal-row:last-child{border-bottom:1px solid var(--line)}
.journal-row:hover{background:var(--ink-2,#151513)}
.journal-row h2{font-size:clamp(20px,2.6vw,28px);font-weight:700;letter-spacing:-.01em;margin:0 0 6px}
.journal-row p{color:var(--steel);margin:0;max-width:60ch}
.journal-arrow{color:var(--signal,#D6FF4B);font-size:18px}
.post-body h2,.post-body h3{margin:1.6em 0 .5em}
.post-body p{margin:0 0 1.1em;line-height:1.7;color:#d9d7d0}
[data-theme="light"] .post-body p{color:#3a3a36}
.post-body ul,.post-body ol{margin:0 0 1.1em 1.2em;line-height:1.7;color:#d9d7d0}
[data-theme="light"] .post-body ul,[data-theme="light"] .post-body ol{color:#3a3a36}
.post-body code{background:var(--ink-2,#151513);padding:2px 6px;font-size:.9em}
[data-theme="light"] .post-body code{background:#e9e6de}
.post-body pre{background:var(--ink-2,#151513);padding:16px;overflow-x:auto;margin:0 0 1.2em}
[data-theme="light"] .post-body pre{background:#e9e6de}
.post-body a{color:var(--signal-text,#D6FF4B)}
@media (max-width:720px){.journal-row{grid-template-columns:1fr;gap:8px}}
</style>`;

function journalShell(opts: {
  title: string;
  description: string;
  body: string;
  jsonLd?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0B0B0A">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="preload" href="/assets/fonts/Geist-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/Geist-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/Geist-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"></noscript>
<script>(function(){try{if(localStorage.getItem('r208-theme')==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();</script>
<link rel="stylesheet" href="/assets/css/style.css">
${JOURNAL_STYLES}
<script>
(function(){var d=document.documentElement;setTimeout(function(){if(!d.classList.contains('js-ready'))d.classList.add('js-fallback');},3000);})();
</script>
<noscript><style>[data-reveal]{opacity:1!important;transform:none!important}.page-title{opacity:1!important}.page-title .word>span{transform:none!important}.preloader{display:none!important}</style></noscript>
${opts.jsonLd || ""}
</head>
<body>
<header class="site-header">
<a class="brand" href="/index.html">${BRAND_SVG}<span>R208<span class="reg">®</span></span></a>
<nav class="main-nav"><a class="nav-link" href="/index.html">Home</a><a class="nav-link" href="/about.html">About</a><a class="nav-link" href="/services.html">Services</a><a class="nav-link" href="/projects.html">Projects</a><a class="nav-link is-active" href="/journal">Journal</a><a class="nav-link" href="/contact.html">Contact</a><a class="cta-btn" href="/contact.html"><span>Start a project</span></a></nav>
<div class="header-side">
<button id="theme-toggle" aria-label="Toggle color theme" aria-pressed="false"><span class="tt-icon"></span></button>
<button class="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</div>
</header>
<main>${opts.body}</main>
<footer class="site-footer">
<div class="wrap">
<div class="footer-grid">
<div>
<a class="brand" href="/index.html" style="margin-bottom:20px">${BRAND_SVG}<span>R208<span class="reg">®</span></span></a>
<p style="color:var(--steel);max-width:34ch">The room where it all gets made. A multidisciplinary agency building digital work end to end.</p>
</div>
<div><h4>Services</h4><a class="f-link" href="/service-web-design-development.html">Web Design & Development</a><a class="f-link" href="/service-ui-ux-design.html">UI/UX Design</a><a class="f-link" href="/service-graphics-design.html">Graphics Design</a><a class="f-link" href="/service-cybersecurity.html">Cybersecurity</a><a class="f-link" href="/service-3d-design.html">3D Design</a><a class="f-link" href="/services.html">All services</a></div>
<div><h4>Agency</h4><a class="f-link" href="/about.html">About</a><a class="f-link" href="/projects.html">Projects</a><a class="f-link" href="/journal">Journal</a><a class="f-link" href="/contact.html">Contact</a></div>
<div><h4>Contact</h4><a class="f-link" href="mailto:r208technologies@gmail.com">r208technologies@gmail.com</a><span class="f-link" style="color:var(--steel)">Abuja / Remote</span></div>
</div>
<div class="footer-word">R208</div>
<div class="footer-base">
<span class="label">© <span data-year>2026</span> R208 Technologies</span>
<span class="label">We don't decorate. We build.</span>
</div>
</div>
</footer>
<script defer src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="/assets/js/data.js"></script>
<script defer src="/assets/js/main.js"></script>
</body>
</html>`;
}

export function renderJournalIndex(posts: PostRow[]): string {
  const items = posts
    .map(
      (p) => `<a class="journal-row" href="/journal/${esc(p.slug)}" data-reveal>
<span class="label" style="color:var(--steel)">${esc(fmtDate(p.publishedAt))}</span>
<span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p></span>
<span class="journal-arrow" aria-hidden="true">→</span>
</a>`
    )
    .join("\n");

  const body = `<section class="page-hero">
<div class="page-hero-ghost" aria-hidden="true">R208</div>
<div class="wrap">
<div class="crumbs"><span class="label">R208</span><span class="label">Journal</span></div>
<h1 class="page-title" data-split data-split-accent="">Journal</h1>
<p class="page-lede" data-reveal data-reveal-delay="1">Notes on design, code, security and pricing — written the way we work: plainly.</p>
</div>
</section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="journal-list">
${items || `<p style="color:var(--steel)">Nothing published yet — the first piece is being written.</p>`}
</div></div></section>`;

  return journalShell({
    title: "Journal — R208 Technologies",
    description:
      "Notes on design, code, security and pricing from R208 Technologies, Abuja.",
    body,
  });
}

export function renderJournalPost(p: PostRow): string {
  const tags = (p.tags || "").split(/\s+/).filter(Boolean);
  const year = fmtDate(p.publishedAt).slice(-4) || "R208";
  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.seoDescription || p.excerpt,
    datePublished: p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined,
    author: { "@type": "Organization", name: "R208 Technologies" },
    ...(p.coverUrl ? { image: [p.coverUrl] } : {}),
  })}</script>`;

  const body = `<section class="page-hero">
<div class="page-hero-ghost" aria-hidden="true">${esc(year)}</div>
<div class="wrap">
<div class="crumbs"><span class="label">R208</span><span class="label">Journal</span>${tags.map((t) => `<span class="label">${esc(t)}</span>`).join("")}</div>
<h1 class="page-title" data-split data-split-accent="">${esc(p.title)}</h1>
<p class="page-lede" data-reveal data-reveal-delay="1">${esc(p.excerpt)}</p>
<div class="label" style="margin-top:18px;color:var(--steel)" data-reveal data-reveal-delay="2">${esc(fmtDate(p.publishedAt))}</div>
</div>
</section>
${p.coverUrl ? `<div class="wrap"><div class="proj-hero-media" data-reveal><img src="${esc(p.coverUrl)}" alt="${esc(p.title)}"></div></div>` : ""}
<section class="section"><div class="wrap"><div class="proj-body post-body">
${markdownToHtml(p.body)}
</div></div></section>
<section class="section cta-band">
<div class="wrap">
<div class="section-kicker" data-reveal><i></i><span class="label">Next step</span></div>
<h2 class="big" data-reveal>Want this level of care <span class="accent">on your project?</span></h2>
<div style="display:flex;gap:16px;flex-wrap:wrap" data-reveal data-reveal-delay="1">
<a class="cta-btn" href="/contact.html"><span>Start a project</span>${ARROW}</a>
<a class="cta-btn cta-btn--ghost" href="/journal"><span>More from the journal</span></a>
</div>
</div>
</section>`;

  return journalShell({
    title: `${p.seoTitle || p.title} — R208 Technologies`,
    description: p.seoDescription || p.excerpt,
    body,
    jsonLd,
  });
}

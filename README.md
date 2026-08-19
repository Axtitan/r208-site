# R208 Technologies — Website

Static, dependency-free site. Open `index.html` in a browser or serve the folder:

    python3 -m http.server 8080

## Pages (18)
- `index.html` — hero (Three.js grid field), who we are, services, projects, testimonials, CTA
- `about.html` — agency story, three rules, meet the team
- `services.html` — all eight services + process
- `service-*.html` — 8 detail pages: overview, deliverables, process, related work
- `projects.html` — filterable grid by discipline
- `project-*.html` — 6 case studies: challenge / approach / outcome
- `contact.html` — validated contact form

## Stack
- Vanilla HTML/CSS/JS, no build step
- GSAP + ScrollTrigger (scroll animation), Lenis (smooth scroll), Three.js (hero), Lottie (tile loop) — all via CDN
- Geist (self-hosted woff2) for body/UI, Space Grotesk (Google Fonts) for display

## Editing content
All copy lives in `build.py` (SERVICES, PROJECTS, TESTI, TEAM, VALUES). Run `python3 build.py` to regenerate every page.
`assets/js/data.js` mirrors the same content as JSON — that's the seam for the CMS: replace the static object with a fetch and the grids render from the API.

## Typography switch
Display face is set in one place, `assets/css/style.css`:

    --font-display:'Space Grotesk','Geist',sans-serif;

Change to `'Geist',sans-serif` for a single-family system.

## Notes
- Project imagery is served from a CDN; drop local files into `assets/img/` and update `images.json` + `build.py` to self-host.
- Contact form is front-end only — point it at Formspree, Resend or your endpoint.
- Respects `prefers-reduced-motion`; 3D hero and cursor disable on touch devices.

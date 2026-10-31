# R208 Technologies — Site + CMS

The R208 website with an integrated content management system. One codebase, one
deployment, no secondary environment: the public site, the admin panel (`/admin`)
and the API all live in the same Next.js app on Vercel.

**Runs free:** Vercel Hobby (hosting) + Neon free tier (Postgres). $0/month.

---

## What's managed in the CMS

| Section | Admin path | Powers |
| --- | --- | --- |
| Projects | `/admin/projects` | Homepage grid, projects page, every `project-*.html` page, image/file uploads |
| Services | `/admin/services` | Service rows across the site (detail pages are still static files) |
| Testimonials | `/admin/testimonials` | Homepage slideshow |
| Journal | `/admin/posts` | Blog at `/journal` — Markdown body, SEO fields, drafts |
| Enquiries | `/admin/enquiries` | Inbox for the contact form (optional email alert per message) |

Everything saves straight to Postgres and is live within about a minute (public
pages are cached at Vercel's edge for 60 seconds). Drafts stay hidden.

A project can also have a **hero video**: put the `.mp4` in `public/assets/projects/`
(uploads are images and files only, and Postgres is no place for video), deploy, then
paste its path, e.g. `/assets/projects/stealth-assist.mp4`, into the project's
"Hero video" field. The page plays it muted and looping with the hero image as its
poster; the image is still what the project cards show.

## First-time setup (~15 minutes)

1. **Create the database (free).** Sign up at [neon.tech](https://neon.tech), create a
   project, and copy the **pooled** connection string (it contains `-pooler` and
   `sslmode=require`).
2. **Install & configure locally:**
   ```bash
   npm install
   cp .env.example .env
   # edit .env: paste your DATABASE_URL, set ADMIN_PASSWORD (min 16 chars; use a random 20+)
   ```
3. **Create the tables:**
   ```bash
   # loads .env automatically if you export it, or prefix inline:
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
4. **Run it:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000/admin`, sign in with your `ADMIN_PASSWORD`.
   All current site content (6 projects, 8 services, 3 testimonials, 1 sample
   post) **auto-seeds on first page load** — nothing to import.

## Deploy to Vercel (free)

1. Push this folder to GitHub (replacing or alongside the current static repo).
2. In Vercel: import the repo (or keep your existing project and point it at the
   new branch).
3. Add environment variables in **Vercel → Settings → Environment Variables**:
   - `DATABASE_URL` — the Neon pooled string
   - `ADMIN_PASSWORD` — your admin password (**min 16 characters**, or login is disabled)
   - `SITE_URL` — e.g. `https://r208-site.vercel.app` (used for sitemap/robots)
   - Optional, for contact-form email alerts: `RESEND_API_KEY`,
     `CONTACT_NOTIFY_EMAIL` (and `CONTACT_FROM_EMAIL` once you verify a domain
     at resend.com)
4. **Run the migration first** from your machine against the production
   `DATABASE_URL` (step 3 above) — it only adds tables, so it's safe while the
   old version is still live. Then deploy. Visit `/admin` and you're live.

## Security notes

- No default password exists. If `ADMIN_PASSWORD` is unset or shorter than 16
  characters, login fails closed.
- Login is rate-limited (`rate_events` table): 5 attempts per IP (per /64 for
  IPv6) per 15 minutes, and at most 60 password checks per hour site-wide. Each
  attempt is recorded *before* it's counted, so parallel bursts can't slip past.
  If the database can't count attempts, login is refused rather than unlimited.
- Sessions are random tokens in an httpOnly, `__Host-`, secure, same-site cookie
  with a 7-day expiry. Only a hash is stored (`admin_sessions`). **Sign out** ends
  the session on the server; **All devices** ends every session. Changing
  `ADMIN_PASSWORD` does *not* sign anyone out — use **All devices** after a change.
- Writes to `/api/admin/*` and `/api/contact` from another site are rejected
  (`src/proxy.ts`).
- Every page sends security headers; public pages have a strict Content Security
  Policy (only this site's scripts plus build-time hashes of the inline snippets).
  GSAP, Lenis and three.js are self-hosted in `public/assets/vendor/`.
- CMS text is HTML-escaped everywhere it's rendered (server and `main.js`), links
  and image URLs must be `https://`, `mailto:` or a `/path`.
- Uploads are type-checked from the file's bytes: JPEG/PNG/GIF/WebP/AVIF images,
  plus PDF/ZIP for downloads. SVG and HTML are refused. Files on draft projects
  are only visible to the admin.
- The contact form has a honeypot field and allows 5 messages per IP per hour
  (100 site-wide).
- `/admin` and `/api/admin` send `X-Robots-Tag: noindex` and are disallowed in
  `robots.txt`.
- **This is a single-password admin** — everyone with the password has full access.
  Real per-user roles (author/editor/admin) are the planned upgrade for launch;
  don't share the password with anyone you wouldn't trust with delete access.

## Limits of the free tier

- **Uploads max 4 MB** per file (Vercel Hobby request limit). Compress images
  first — the site serves WebP, so convert before uploading.
- Uploaded images/files live inside Postgres (Neon free tier: 0.5 GB). Plenty for
  dozens of projects; if you outgrow it, we move media to object storage.
- Neon's free database sleeps when idle: the first admin page load after a quiet
  period takes ~1–2 seconds. Normal and harmless.
- Vercel Hobby's terms disallow commercial use — fine while testing, upgrade to
  Pro (~$20/mo) when the site goes official with a domain.

## Structure

```
public/                  the static site (13 pages, untouched)
src/app/
  admin/                 CMS dashboard (login-gated)
  api/admin/             CRUD API (auth-required)
  api/files/[id]/        serves uploaded media from the DB
  assets/js/data.js/     generates the site's data layer from the DB
  journal/               blog index + article pages (dynamic)
  p/[slug]/              dynamic project pages (URL-rewritten to project-*.html)
  sitemap.ts robots.ts   SEO
src/lib/
  auth.ts                password check + sessions
  rate-limit.ts          login / contact-form rate limits
  uploads.ts             upload type checks
src/proxy.ts             blocks cross-site writes to the API
  crud.ts                generic CRUD factory for collections
  collections.ts         server configs: services / testimonials / posts
  collection-config.ts   admin UI configs (client-safe mirror)
  site-data.ts           seed content + published-content queries
  render.ts              HTML renderers (project pages, journal, markdown)
scripts/migrate.mjs      one-command schema setup
```

## When you're ready to go official

The planned upgrade path (nothing here is thrown away): real user accounts with
roles, Payload-grade drafts/versions, media moved to object storage, Vercel Pro,
custom domain. Same code, same database.

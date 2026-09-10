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

Everything saves straight to Postgres and is live immediately. Drafts stay hidden.

## First-time setup (~15 minutes)

1. **Create the database (free).** Sign up at [neon.tech](https://neon.tech), create a
   project, and copy the **pooled** connection string (it contains `-pooler` and
   `sslmode=require`).
2. **Install & configure locally:**
   ```bash
   npm install
   cp .env.example .env
   # edit .env: paste your DATABASE_URL, set a strong ADMIN_PASSWORD (min 8 chars)
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
   - `ADMIN_PASSWORD` — your admin password
   - `SITE_URL` — e.g. `https://r208-site.vercel.app` (used for sitemap/robots)
4. Deploy. Then run the migration once from your machine against the production
   `DATABASE_URL` (step 3 above). Visit `/admin` and you're live.

## Security notes

- No default password exists. If `ADMIN_PASSWORD` is unset, login fails closed.
- Login is rate-limited: 5 failed attempts from one IP locks it for 15 minutes
  (tracked in the `login_attempts` table).
- Sessions are an httpOnly, secure (in production), same-site cookie, 7-day expiry.
  Changing `ADMIN_PASSWORD` invalidates all sessions.
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
  auth.ts                password check + session cookie
  rate-limit.ts          login lockout
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

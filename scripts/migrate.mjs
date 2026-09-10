#!/usr/bin/env node
/* Applies the R208 CMS schema to the database in DATABASE_URL.
   Safe to re-run — every statement is idempotent (IF NOT EXISTS).

   Usage:  DATABASE_URL="postgresql://..." npm run db:migrate
*/
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'ERROR: DATABASE_URL is not set.\nUsage: DATABASE_URL="postgresql://..." npm run db:migrate'
  );
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(url);
const pool = new pg.Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  cats text NOT NULL DEFAULT '',
  cat_label text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '2026',
  client text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  hero_image_url text NOT NULL DEFAULT '',
  intro text NOT NULL DEFAULT '',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_assets (
  id serial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image',
  filename text NOT NULL,
  mime_type text NOT NULL,
  size integer NOT NULL DEFAULT 0,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  data bytea NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  num text NOT NULL DEFAULT '01',
  name text NOT NULL,
  tags text NOT NULL DEFAULT '',
  lede text NOT NULL DEFAULT '',
  cat text NOT NULL DEFAULT 'web',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id serial PRIMARY KEY,
  quote text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  tags text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  published_at timestamp,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id serial PRIMARY KEY,
  ip text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_assets_project_idx ON project_assets (project_id);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts (ip, created_at);
`;

try {
  await pool.query(SQL);
  console.log(
    "Schema applied: projects, project_assets, services, testimonials, posts, login_attempts"
  );
  console.log("Content auto-seeds on first site visit — no separate seed step needed.");
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

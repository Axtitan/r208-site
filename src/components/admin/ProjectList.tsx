"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: number;
  slug: string;
  name: string;
  catLabel: string;
  year: string;
  heroImageUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
};

export default function ProjectList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/projects");
    if (res.ok) setRows(await res.json());
    else setError("Failed to load projects.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createProject() {
    setCreating(true);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled project" }),
    });
    setCreating(false);
    if (res.ok) {
      const row = await res.json();
      window.location.href = `/admin/projects/${row.id}`;
    }
  }

  async function move(idx: number, dir: -1 | 1) {
    if (!rows) return;
    const next = [...rows];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setRows(next);
    await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((r) => r.id) }),
    });
  }

  async function toggle(row: Row, field: "published" | "featured") {
    const res = await fetch(`/api/admin/projects/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !row[field] }),
    });
    if (res.ok) load();
  }

  async function remove(row: Row) {
    if (!confirm(`Delete "${row.name}"? This also deletes its uploaded images and files.`)) return;
    await fetch(`/api/admin/projects/${row.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#8a8a84]">Content</p>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-2 max-w-xl text-sm text-[#8a8a84]">
            These power the grids on the homepage &amp; projects page and each{" "}
            <code>project-*.html</code> detail page. Order here is the order on the site.
          </p>
        </div>
        <button
          onClick={createProject}
          disabled={creating}
          className="bg-[#D6FF4B] px-4 py-2.5 text-sm font-semibold text-[#0B0B0A] transition hover:bg-[#c8f13d] disabled:opacity-50"
        >
          {creating ? "Creating…" : "+ New project"}
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!rows && !error && <p className="text-[#8a8a84]">Loading…</p>}

      {rows && (
        <div className="divide-y divide-[#2a2a27] border border-[#2a2a27]">
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-4 bg-[#111110] px-4 py-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="px-1 text-xs text-[#8a8a84] hover:text-[#F4F2EE] disabled:opacity-25"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  className="px-1 text-xs text-[#8a8a84] hover:text-[#F4F2EE] disabled:opacity-25"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              {row.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.heroImageUrl}
                  alt=""
                  className="h-12 w-20 shrink-0 object-cover"
                />
              ) : (
                <div className="h-12 w-20 shrink-0 bg-[#1c1c1a]" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/projects/${row.id}`}
                  className="font-semibold hover:text-[#D6FF4B]"
                >
                  {row.name}
                </Link>
                <p className="truncate text-xs text-[#8a8a84]">
                  /project-{row.slug}.html · {row.catLabel || "no category"} · {row.year}
                </p>
              </div>
              <button
                onClick={() => toggle(row, "featured")}
                className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  row.featured
                    ? "border-[#D6FF4B] text-[#D6FF4B]"
                    : "border-[#2a2a27] text-[#5b5b56] hover:text-[#8a8a84]"
                }`}
                title="Featured projects appear on the homepage"
              >
                {row.featured ? "Featured" : "Not featured"}
              </button>
              <button
                onClick={() => toggle(row, "published")}
                className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  row.published
                    ? "border-emerald-500 text-emerald-400"
                    : "border-amber-600 text-amber-500"
                }`}
              >
                {row.published ? "Published" : "Draft"}
              </button>
              <a
                href={`/project-${row.slug}.html`}
                target="_blank"
                className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
              >
                View
              </a>
              <Link
                href={`/admin/projects/${row.id}`}
                className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
              >
                Edit
              </Link>
              <button
                onClick={() => remove(row)}
                className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-red-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="bg-[#111110] px-4 py-8 text-center text-[#8a8a84]">
              No projects yet. Create the first one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

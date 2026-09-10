"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { COLLECTIONS } from "@/lib/collection-config";

type Row = Record<string, any>;

export default function CollectionList({ collection }: { collection: string }) {
  const cfg = COLLECTIONS[collection];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(cfg.apiPath);
    if (res.ok) setRows(await res.json());
    else setError(`Failed to load ${cfg.title.toLowerCase()}.`);
  }, [cfg]);

  useEffect(() => {
    load();
  }, [load]);

  async function createItem() {
    setCreating(true);
    const res = await fetch(cfg.apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [cfg.titleField]: `Untitled ${cfg.singular}` }),
    });
    setCreating(false);
    if (res.ok) {
      const row = await res.json();
      window.location.href = `${cfg.adminPath}/${row.id}`;
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create.");
    }
  }

  async function move(idx: number, dir: -1 | 1) {
    if (!rows || !cfg.reorderable) return;
    const next = [...rows];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setRows(next);
    await fetch(cfg.apiPath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((r) => r.id) }),
    });
  }

  async function togglePublished(row: Row) {
    const res = await fetch(`${cfg.apiPath}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !row.published }),
    });
    if (res.ok) load();
  }

  async function remove(row: Row) {
    if (!confirm(`Delete "${row[cfg.titleField]}"? This cannot be undone.`)) return;
    await fetch(`${cfg.apiPath}/${row.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#8a8a84]">Content</p>
          <h1 className="text-3xl font-bold tracking-tight">{cfg.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-[#8a8a84]">{cfg.description}</p>
        </div>
        <button
          onClick={createItem}
          disabled={creating}
          className="bg-[#D6FF4B] px-4 py-2.5 text-sm font-semibold text-[#0B0B0A] transition hover:bg-[#c8f13d] disabled:opacity-50"
        >
          {creating ? "Creating…" : cfg.createLabel}
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!rows && !error && <p className="text-[#8a8a84]">Loading…</p>}

      {rows && (
        <div className="divide-y divide-[#2a2a27] border border-[#2a2a27]">
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-4 bg-[#111110] px-4 py-3">
              {cfg.reorderable && (
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
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`${cfg.adminPath}/${row.id}`}
                  className="font-semibold hover:text-[#D6FF4B]"
                >
                  {row[cfg.titleField]}
                </Link>
                <p className="truncate text-xs text-[#8a8a84]">
                  {cfg.metaFields.map((k) => String(row[k] || "")).filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => togglePublished(row)}
                className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  row.published
                    ? "border-emerald-500 text-emerald-400"
                    : "border-amber-600 text-amber-500"
                }`}
              >
                {row.published ? "Published" : "Draft"}
              </button>
              {cfg.viewPath && (
                <a
                  href={cfg.viewPath(row)}
                  target="_blank"
                  className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
                >
                  View
                </a>
              )}
              <Link
                href={`${cfg.adminPath}/${row.id}`}
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
              Nothing here yet. Create the first one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

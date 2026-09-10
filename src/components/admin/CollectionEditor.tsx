"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { COLLECTIONS, type FieldConfig } from "@/lib/collection-config";

type Row = Record<string, any>;

const inputCls =
  "w-full border border-[#2a2a27] bg-[#0B0B0A] px-3 py-2 text-sm outline-none focus:border-[#D6FF4B]";
const labelCls = "mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[#8a8a84]";
const btnGhost =
  "border border-[#2a2a27] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-[#8a8a84] transition hover:border-[#D6FF4B] hover:text-[#F4F2EE]";

function toDateInput(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CollectionEditor({
  collection,
  id,
}: {
  collection: string;
  id: string;
}) {
  const cfg = COLLECTIONS[collection];
  const [row, setRow] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`${cfg.apiPath}/${id}`);
    if (res.ok) setRow(await res.json());
    else setError(`${cfg.singular} not found.`);
  }, [cfg, id]);

  useEffect(() => {
    load();
  }, [load]);

  function patch(update: Row) {
    setRow((prev) => (prev ? { ...prev, ...update } : prev));
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    setError("");
    const res = await fetch(`${cfg.apiPath}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setSaving(false);
    if (res.ok) {
      setRow(await res.json());
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save.");
    }
  }

  async function remove() {
    if (!row) return;
    if (!confirm(`Delete "${row[cfg.titleField]}"? This cannot be undone.`)) return;
    await fetch(`${cfg.apiPath}/${row.id}`, { method: "DELETE" });
    window.location.href = cfg.adminPath;
  }

  if (error && !row) {
    return (
      <div>
        <p className="mb-4 text-red-400">{error}</p>
        <Link href={cfg.adminPath} className={btnGhost}>
          ← Back to {cfg.title.toLowerCase()}
        </Link>
      </div>
    );
  }
  if (!row) return <p className="text-[#8a8a84]">Loading…</p>;

  function renderField(f: FieldConfig) {
    const v = row![f.key];
    if (f.type === "checkbox") {
      return (
        <label className="flex items-center justify-between border border-[#2a2a27] bg-[#111110] px-4 py-3 text-sm">
          <span>{f.label}</span>
          <input
            type="checkbox"
            checked={!!v}
            onChange={(e) => patch({ [f.key]: e.target.checked })}
          />
        </label>
      );
    }
    return (
      <div>
        <label className={labelCls}>{f.label}</label>
        {f.type === "textarea" ? (
          <textarea
            className={inputCls}
            rows={f.rows || 4}
            value={v || ""}
            placeholder={f.placeholder}
            onChange={(e) => patch({ [f.key]: e.target.value })}
          />
        ) : f.type === "select" ? (
          <select
            className={inputCls}
            value={v || ""}
            onChange={(e) => patch({ [f.key]: e.target.value })}
          >
            {(f.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : f.type === "datetime" ? (
          <input
            type="datetime-local"
            className={inputCls}
            value={toDateInput(v)}
            onChange={(e) =>
              patch({ [f.key]: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        ) : (
          <input
            className={inputCls}
            value={v || ""}
            placeholder={f.placeholder}
            onChange={(e) => patch({ [f.key]: e.target.value })}
          />
        )}
        {f.help && <p className="mt-1 text-xs text-[#5b5b56]">{f.help}</p>}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={cfg.adminPath}
            className="text-xs uppercase tracking-[0.14em] text-[#8a8a84] hover:text-[#F4F2EE]"
          >
            ← {cfg.title}
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{row[cfg.titleField]}</h1>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-sm text-emerald-400">Saved ✓</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
          {cfg.viewPath && (
            <a href={cfg.viewPath(row)} target="_blank" className={btnGhost}>
              Preview ↗
            </a>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="bg-[#D6FF4B] px-5 py-2 text-sm font-semibold text-[#0B0B0A] transition hover:bg-[#c8f13d] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {cfg.fields.map((f) => (
          <div key={f.key}>{renderField(f)}</div>
        ))}
      </div>

      <div className="mt-10 border border-red-900/50 bg-[#111110] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-400">Danger zone</p>
            <p className="text-xs text-[#5b5b56]">Deleting a {cfg.singular} is permanent.</p>
          </div>
          <button
            onClick={remove}
            className="border border-red-900 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-950"
          >
            Delete this {cfg.singular}
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#2a2a27] bg-[#0B0B0A]/95 p-3 backdrop-blur lg:hidden">
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#D6FF4B] px-5 py-2.5 text-sm font-semibold text-[#0B0B0A] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

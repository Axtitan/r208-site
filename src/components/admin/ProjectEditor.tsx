"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Section = { heading: string; body: string; bold?: boolean };
type LinkItem = { label: string; url: string };
type Asset = {
  id: number;
  kind: string;
  filename: string;
  mimeType: string;
  size: number;
  caption: string;
};

type ProjectData = {
  id: number;
  slug: string;
  name: string;
  cats: string;
  catLabel: string;
  year: string;
  client: string;
  role: string;
  heroImageUrl: string;
  intro: string;
  sections: Section[];
  links: LinkItem[];
  featured: boolean;
  published: boolean;
  assets: Asset[];
};

const CATEGORIES = [
  { slug: "web", label: "Web" },
  { slug: "uiux", label: "UI/UX" },
  { slug: "graphics", label: "Graphics" },
  { slug: "security", label: "Security" },
  { slug: "3d", label: "3D" },
  { slug: "video", label: "Video" },
  { slug: "ai", label: "AI" },
  { slug: "copy", label: "Copy" },
];

const inputCls =
  "w-full border border-[#2a2a27] bg-[#0B0B0A] px-3 py-2 text-sm outline-none focus:border-[#D6FF4B]";
const labelCls = "mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[#8a8a84]";
const btnGhost =
  "border border-[#2a2a27] px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-[#8a8a84] transition hover:border-[#D6FF4B] hover:text-[#F4F2EE]";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ProjectEditor({ id }: { id: string }) {
  const [p, setP] = useState<ProjectData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState<"" | "hero" | "image" | "file">("");
  const heroInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects/${id}`);
    if (res.ok) setP(await res.json());
    else setError("Project not found.");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function patch(update: Partial<ProjectData>) {
    setP((prev) => (prev ? { ...prev, ...update } : prev));
  }

  async function save(extra?: Partial<ProjectData>) {
    if (!p) return;
    setSaving(true);
    setError("");
    const body = { ...p, ...extra };
    const res = await fetch(`/api/admin/projects/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setP(await res.json());
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save.");
    }
  }

  async function upload(kind: "hero" | "image" | "file", files: FileList | null) {
    if (!p || !files || files.length === 0) return;
    setUploading(kind);
    setError("");
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch(`/api/admin/projects/${p.id}/assets`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to upload ${file.name}`);
      }
    }
    setUploading("");
    load();
  }

  async function deleteAsset(a: Asset) {
    if (!p) return;
    if (!confirm(`Remove ${a.filename}?`)) return;
    await fetch(`/api/admin/assets/${a.id}`, { method: "DELETE" });
    if (p.heroImageUrl === `/api/files/${a.id}`) {
      await fetch(`/api/admin/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroImageUrl: "" }),
      });
    }
    load();
  }

  async function updateCaption(a: Asset, caption: string) {
    await fetch(`/api/admin/assets/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
  }

  if (error && !p) {
    return (
      <div>
        <p className="mb-4 text-red-400">{error}</p>
        <Link href="/admin" className={btnGhost}>← Back to projects</Link>
      </div>
    );
  }
  if (!p) return <p className="text-[#8a8a84]">Loading…</p>;

  const catSlugs = p.cats.split(" ").filter(Boolean);
  const gallery = p.assets.filter((a) => a.kind === "image");
  const files = p.assets.filter((a) => a.kind === "file");

  return (
    <div className="pb-24">
      {/* Top bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs uppercase tracking-[0.14em] text-[#8a8a84] hover:text-[#F4F2EE]">
            ← Projects
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-sm text-emerald-400">Saved ✓</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
          <a href={`/project-${p.slug}.html`} target="_blank" className={btnGhost}>
            Preview ↗
          </a>
          <button
            onClick={() => save()}
            disabled={saving}
            className="bg-[#D6FF4B] px-5 py-2 text-sm font-semibold text-[#0B0B0A] transition hover:bg-[#c8f13d] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-8">
          {/* Basics */}
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Project name</label>
                <input className={inputCls} value={p.name} onChange={(e) => patch({ name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>URL slug</label>
                <input className={inputCls} value={p.slug} onChange={(e) => patch({ slug: e.target.value })} />
                <p className="mt-1 text-xs text-[#5b5b56]">/project-{p.slug || "…"}.html</p>
              </div>
              <div>
                <label className={labelCls}>Client</label>
                <input className={inputCls} value={p.client} onChange={(e) => patch({ client: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input className={inputCls} value={p.year} onChange={(e) => patch({ year: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input className={inputCls} value={p.role} onChange={(e) => patch({ role: e.target.value })} placeholder="Design & Build" />
              </div>
              <div>
                <label className={labelCls}>Discipline label</label>
                <input className={inputCls} value={p.catLabel} onChange={(e) => patch({ catLabel: e.target.value })} placeholder="Web / UI-UX" />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Intro (page lede)</label>
              <textarea
                className={`${inputCls} min-h-[70px]`}
                value={p.intro}
                onChange={(e) => patch({ intro: e.target.value })}
              />
            </div>
            <div className="mt-4">
              <label className={labelCls}>Filter categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = catSlugs.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? catSlugs.filter((s) => s !== c.slug)
                          : [...catSlugs, c.slug];
                        patch({ cats: next.join(" ") });
                      }}
                      className={`border px-3 py-1 text-xs transition ${
                        active
                          ? "border-[#D6FF4B] bg-[#D6FF4B]/10 text-[#D6FF4B]"
                          : "border-[#2a2a27] text-[#8a8a84] hover:text-[#F4F2EE]"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-[#5b5b56]">Controls which filter chips show this project on the projects page.</p>
            </div>
          </section>

          {/* Case study sections */}
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Case study sections</h2>
              <button
                className={btnGhost}
                onClick={() => patch({ sections: [...p.sections, { heading: "New section", body: "" }] })}
              >
                + Add section
              </button>
            </div>
            <div className="space-y-5">
              {p.sections.map((s, i) => (
                <div key={i} className="border border-[#2a2a27] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      className={`${inputCls} font-semibold`}
                      value={s.heading}
                      onChange={(e) => {
                        const sections = [...p.sections];
                        sections[i] = { ...s, heading: e.target.value };
                        patch({ sections });
                      }}
                    />
                    <button
                      className="shrink-0 px-2 text-xs text-[#8a8a84] hover:text-[#F4F2EE] disabled:opacity-25"
                      disabled={i === 0}
                      onClick={() => {
                        const sections = [...p.sections];
                        [sections[i - 1], sections[i]] = [sections[i], sections[i - 1]];
                        patch({ sections });
                      }}
                    >
                      ▲
                    </button>
                    <button
                      className="shrink-0 px-2 text-xs text-[#8a8a84] hover:text-[#F4F2EE] disabled:opacity-25"
                      disabled={i === p.sections.length - 1}
                      onClick={() => {
                        const sections = [...p.sections];
                        [sections[i], sections[i + 1]] = [sections[i + 1], sections[i]];
                        patch({ sections });
                      }}
                    >
                      ▼
                    </button>
                    <button
                      className="shrink-0 px-2 text-xs text-[#8a8a84] hover:text-red-400"
                      onClick={() => patch({ sections: p.sections.filter((_, j) => j !== i) })}
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    className={`${inputCls} min-h-[110px]`}
                    value={s.body}
                    onChange={(e) => {
                      const sections = [...p.sections];
                      sections[i] = { ...s, body: e.target.value };
                      patch({ sections });
                    }}
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-[#8a8a84]">
                    <input
                      type="checkbox"
                      checked={!!s.bold}
                      onChange={(e) => {
                        const sections = [...p.sections];
                        sections[i] = { ...s, bold: e.target.checked };
                        patch({ sections });
                      }}
                    />
                    Emphasised (bold, like “The outcome”)
                  </label>
                </div>
              ))}
              {p.sections.length === 0 && (
                <p className="text-sm text-[#5b5b56]">No sections yet — add “The challenge”, “Our approach”, “The outcome”…</p>
              )}
            </div>
          </section>

          {/* Links */}
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Links</h2>
              <button className={btnGhost} onClick={() => patch({ links: [...p.links, { label: "", url: "" }] })}>
                + Add link
              </button>
            </div>
            <div className="space-y-3">
              {p.links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="Label (e.g. Visit live site)"
                    value={l.label}
                    onChange={(e) => {
                      const links = [...p.links];
                      links[i] = { ...l, label: e.target.value };
                      patch({ links });
                    }}
                  />
                  <input
                    className={inputCls}
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) => {
                      const links = [...p.links];
                      links[i] = { ...l, url: e.target.value };
                      patch({ links });
                    }}
                  />
                  <button
                    className="shrink-0 px-2 text-xs text-[#8a8a84] hover:text-red-400"
                    onClick={() => patch({ links: p.links.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {p.links.length === 0 && (
                <p className="text-sm text-[#5b5b56]">Shown as buttons on the project page (live site, press coverage…).</p>
              )}
            </div>
          </section>

          {/* Gallery */}
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Gallery images</h2>
              <button className={btnGhost} onClick={() => galleryInput.current?.click()}>
                {uploading === "image" ? "Uploading…" : "+ Upload images"}
              </button>
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => upload("image", e.target.files)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {gallery.map((a) => (
                <div key={a.id} className="border border-[#2a2a27]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/files/${a.id}`} alt={a.filename} className="aspect-video w-full object-cover" />
                  <div className="flex items-center gap-2 p-2">
                    <input
                      className="w-full bg-transparent px-1 text-xs text-[#8a8a84] outline-none placeholder:text-[#5b5b56] focus:text-[#F4F2EE]"
                      placeholder="Caption (optional)"
                      defaultValue={a.caption}
                      onBlur={(e) => updateCaption(a, e.target.value)}
                    />
                    <button className="px-1 text-xs text-[#8a8a84] hover:text-red-400" onClick={() => deleteAsset(a)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {gallery.length === 0 && (
              <p className="text-sm text-[#5b5b56]">Uploaded images appear in a gallery below the case study.</p>
            )}
          </section>

          {/* Files */}
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Downloadable files</h2>
              <button className={btnGhost} onClick={() => fileInput.current?.click()}>
                {uploading === "file" ? "Uploading…" : "+ Upload files"}
              </button>
              <input ref={fileInput} type="file" multiple hidden onChange={(e) => upload("file", e.target.files)} />
            </div>
            <div className="space-y-2">
              {files.map((a) => (
                <div key={a.id} className="flex items-center gap-3 border border-[#2a2a27] px-3 py-2">
                  <span className="text-lg">📄</span>
                  <div className="min-w-0 flex-1">
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[#5b5b56]"
                      placeholder="Display name (optional)"
                      defaultValue={a.caption}
                      onBlur={(e) => updateCaption(a, e.target.value)}
                    />
                    <p className="truncate text-xs text-[#5b5b56]">
                      {a.filename} · {formatSize(a.size)}
                    </p>
                  </div>
                  <a href={`/api/files/${a.id}?download=1`} className="text-xs text-[#8a8a84] hover:text-[#F4F2EE]">
                    Download
                  </a>
                  <button className="px-1 text-xs text-[#8a8a84] hover:text-red-400" onClick={() => deleteAsset(a)}>
                    ✕
                  </button>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-sm text-[#5b5b56]">PDFs, case-study decks, brand files… listed as downloads on the project page.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Status</h2>
            <label className="mb-3 flex items-center justify-between text-sm">
              <span>Published</span>
              <input type="checkbox" checked={p.published} onChange={(e) => patch({ published: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Featured on homepage</span>
              <input type="checkbox" checked={p.featured} onChange={(e) => patch({ featured: e.target.checked })} />
            </label>
            <p className="mt-3 text-xs text-[#5b5b56]">
              Drafts are hidden from the site entirely. The homepage shows the first four featured projects.
            </p>
          </section>

          <section className="border border-[#2a2a27] bg-[#111110] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#D6FF4B]">Hero image</h2>
            {p.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.heroImageUrl} alt="Hero" className="mb-3 aspect-video w-full border border-[#2a2a27] object-cover" />
            ) : (
              <div className="mb-3 flex aspect-video w-full items-center justify-center border border-dashed border-[#2a2a27] text-xs text-[#5b5b56]">
                No hero image
              </div>
            )}
            <div className="mb-3 flex gap-2">
              <button className={`${btnGhost} flex-1`} onClick={() => heroInput.current?.click()}>
                {uploading === "hero" ? "Uploading…" : "Upload image"}
              </button>
              <input ref={heroInput} type="file" accept="image/*" hidden onChange={(e) => upload("hero", e.target.files)} />
            </div>
            <label className={labelCls}>…or paste an image URL</label>
            <input
              className={inputCls}
              value={p.heroImageUrl}
              onChange={(e) => patch({ heroImageUrl: e.target.value })}
              placeholder="https://… or /api/files/1"
            />
            <p className="mt-2 text-xs text-[#5b5b56]">Used on the project cards and at the top of the project page.</p>
          </section>
        </div>
      </div>

      {/* Sticky save on small screens */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#2a2a27] bg-[#0B0B0A]/95 p-3 backdrop-blur lg:hidden">
        <button
          onClick={() => save()}
          disabled={saving}
          className="w-full bg-[#D6FF4B] px-5 py-2.5 text-sm font-semibold text-[#0B0B0A] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

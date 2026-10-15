"use client";

import { useCallback, useEffect, useState } from "react";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function fmt(d: string): string {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnquiryList() {
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/enquiries");
    if (res.ok) setRows(await res.json());
    else setError("Failed to load enquiries.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setRead(row: Enquiry, read: boolean) {
    setRows((rs) => rs && rs.map((r) => (r.id === row.id ? { ...r, read } : r)));
    await fetch(`/api/admin/enquiries/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
  }

  function toggle(row: Enquiry) {
    const opening = open !== row.id;
    setOpen(opening ? row.id : null);
    if (opening && !row.read) setRead(row, true);
  }

  async function remove(row: Enquiry) {
    if (!confirm(`Delete the enquiry from ${row.name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/enquiries/${row.id}`, { method: "DELETE" });
    load();
  }

  const unread = rows ? rows.filter((r) => !r.read).length : 0;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[#8a8a84]">Inbox</p>
        <h1 className="text-3xl font-bold tracking-tight">Enquiries</h1>
        <p className="mt-2 max-w-xl text-sm text-[#8a8a84]">
          Messages sent through the contact form.{" "}
          {rows && (unread ? `${unread} unread.` : "All caught up.")}
        </p>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!rows && !error && <p className="text-[#8a8a84]">Loading…</p>}

      {rows && (
        <div className="divide-y divide-[#2a2a27] border border-[#2a2a27]">
          {rows.map((row) => (
            <div key={row.id} className="bg-[#111110]">
              <div className="flex items-center gap-4 px-4 py-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${row.read ? "bg-transparent" : "bg-[#D6FF4B]"}`}
                  aria-label={row.read ? "Read" : "Unread"}
                />
                <button onClick={() => toggle(row)} className="min-w-0 flex-1 text-left">
                  <span className={`block ${row.read ? "" : "font-semibold"} hover:text-[#D6FF4B]`}>
                    {row.name}
                    {row.company && <span className="text-[#8a8a84]"> · {row.company}</span>}
                  </span>
                  <span className="block truncate text-xs text-[#8a8a84]">
                    {fmt(row.createdAt)} · {[row.service, row.budget].filter(Boolean).join(" · ")}
                  </span>
                </button>
                <a
                  href={`mailto:${row.email}`}
                  className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
                >
                  Reply
                </a>
                <button
                  onClick={() => setRead(row, !row.read)}
                  className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
                >
                  {row.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  onClick={() => remove(row)}
                  className="border border-[#2a2a27] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8a8a84] hover:border-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
              {open === row.id && (
                <div className="border-t border-[#2a2a27] px-10 py-5 text-sm">
                  <p className="mb-3 text-[#8a8a84]">{row.email}</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{row.message}</p>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="bg-[#111110] px-4 py-8 text-center text-[#8a8a84]">
              No enquiries yet. They&apos;ll appear here when someone uses the contact form.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

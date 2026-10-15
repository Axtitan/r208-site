"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      // Show the server's reason: wrong password, locked out, or unavailable.
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed. Try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-[#2a2a27] bg-[#111110] p-8">
        <div className="mb-6 flex items-center gap-3">
          <svg width="34" height="23" viewBox="0 0 34 23" fill="none" aria-hidden="true">
            <rect width="10" height="10" fill="#F4F2EE" /><rect x="12" width="10" height="10" fill="#F4F2EE" />
            <rect x="24" width="10" height="10" fill="#D6FF4B" /><rect y="12" width="10" height="10" fill="#F4F2EE" />
            <rect x="12" y="12" width="10" height="10" fill="#F4F2EE" /><rect x="24" y="12" width="10" height="10" fill="#F4F2EE" />
          </svg>
          <span className="text-lg font-bold tracking-tight">R208 CMS</span>
        </div>
        <p className="mb-6 text-sm text-[#8a8a84]">
          Enter the admin password to manage the site content.
        </p>
        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-[#8a8a84]">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="mb-4 w-full border border-[#2a2a27] bg-[#0B0B0A] px-3 py-2.5 text-sm outline-none focus:border-[#D6FF4B]"
          placeholder="••••••••"
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full bg-[#D6FF4B] px-4 py-2.5 text-sm font-semibold text-[#0B0B0A] transition hover:bg-[#c8f13d] disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-[#5b5b56]">
          Set via the <code className="text-[#8a8a84]">ADMIN_PASSWORD</code> environment variable.
          Too many failed attempts locks this device out for 15 minutes.
        </p>
      </form>
    </div>
  );
}

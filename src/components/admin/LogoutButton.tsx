"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function signOut(everywhere: boolean) {
    if (everywhere && !confirm("Sign out on every device, including this one?")) return;
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ everywhere }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => signOut(true)}
        className="text-[10px] uppercase tracking-[0.14em] text-[#5b5b56] transition hover:text-[#F4F2EE]"
      >
        All devices
      </button>
      <button
        onClick={() => signOut(false)}
        className="border border-[#2a2a27] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[#8a8a84] transition hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
      >
        Sign out
      </button>
    </div>
  );
}

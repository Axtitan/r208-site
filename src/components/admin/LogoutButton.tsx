"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
      }}
      className="border border-[#2a2a27] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[#8a8a84] transition hover:border-[#D6FF4B] hover:text-[#F4F2EE]"
    >
      Sign out
    </button>
  );
}

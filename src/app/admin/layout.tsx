import type { ReactNode } from "react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import LoginGate from "@/components/admin/LoginGate";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/posts", label: "Journal" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authed = await isAdmin();
  if (!authed) return <LoginGate />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a27] bg-[#0B0B0A]/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <svg width="28" height="19" viewBox="0 0 34 23" fill="none" aria-hidden="true">
              <rect width="10" height="10" fill="#F4F2EE" /><rect x="12" width="10" height="10" fill="#F4F2EE" />
              <rect x="24" width="10" height="10" fill="#D6FF4B" /><rect y="12" width="10" height="10" fill="#F4F2EE" />
              <rect x="12" y="12" width="10" height="10" fill="#F4F2EE" /><rect x="24" y="12" width="10" height="10" fill="#F4F2EE" />
            </svg>
            <span className="font-bold tracking-tight">R208 CMS</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-[#8a8a84]">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-[#F4F2EE]">
                {n.label}
              </Link>
            ))}
            <a href="/index.html" target="_blank" className="hover:text-[#F4F2EE]">
              View site ↗
            </a>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

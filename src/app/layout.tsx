import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "R208 CMS",
  description: "Content management for R208 Technologies.",
  icons: { icon: "/assets/img/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0B0A] text-[#F4F2EE] antialiased">
        {children}
      </body>
    </html>
  );
}

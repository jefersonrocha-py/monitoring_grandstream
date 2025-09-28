"use client";

import TopBar from "@components/TopBar";
import Footer from "@components/Footer";
import { useUIStore } from "@store/ui";
import { useEffect, useState } from "react";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  // Evita mismatch de hidratação (SSR vs Client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ml = sidebarOpen ? "ml-64" : "ml-16";

  return (
    <div
      className={`relative flex flex-col min-h-screen transition-[margin] duration-300 ${
        mounted ? ml : "ml-16"
      }`}
    >
      <TopBar />
      <main className="flex-1 p-4 md:p-6">{children}</main>
      <Footer />
    </div>
  );
}

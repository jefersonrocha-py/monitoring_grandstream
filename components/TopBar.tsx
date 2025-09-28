"use client";

import { useRouter } from "next/navigation";
import { useUIStore } from "@store/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRightFromBracket,
  faMagnifyingGlass,
  faRotateRight,
  faMoon,
  faSun,
  faExpand,
  faCompress,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useState } from "react";

export default function TopBar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const router = useRouter();

  // ===== Theme (persistência simples)
  const [isDark, setIsDark] = useState<boolean>(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const enabled = stored ? stored === "dark" : prefersDark ?? true;
    root.classList.toggle("dark", enabled);
    setIsDark(enabled);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("theme");
      if (!saved) {
        root.classList.toggle("dark", e.matches);
        setIsDark(e.matches);
      }
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const next = !isDark;
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }, [isDark]);

  // ===== Sidebar
  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [sidebarOpen, setSidebarOpen]);

  // ===== Fullscreen do MAPA (#map-root)
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = () => {
      const el = document.getElementById("map-root");
      const current = document.fullscreenElement;
      setIsFs(!!el && (current === el || (current && el?.contains(current))));
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("map-root") as any;
    if (!el) return;

    try {
      const current = document.fullscreenElement;
      const isTarget = current === el || (current && el.contains(current));

      if (!current || !isTarget) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen(); // Safari
        setIsFs(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else (document as any).webkitExitFullscreen?.();
        setIsFs(false);
      }
    } catch {
      // silencioso
    }
  }, []);

  // ===== Logout
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/20 border-b border-white/10">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Toggle sidebar */}
        <button
          onClick={toggleSidebar}
          className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
          title={sidebarOpen ? "Ocultar menu" : "Mostrar menu"}
          aria-label="Alternar menu lateral"
        >
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </button>

        {/* Busca */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 h-4 w-4"
            />
            <input
              className="w-full pl-9 pr-3 h-9 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-brand3 outline-none"
              placeholder="Pesquisar antena (nome)..."
              aria-label="Pesquisar antena"
            />
          </div>
        </div>

        {/* Recarregar */}
        <button
          onClick={() => location.reload()}
          className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
          title="Recarregar"
          aria-label="Recarregar"
        >
          <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
        </button>

        {/* Fullscreen do mapa */}
        <button
          onClick={toggleFullscreen}
          className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
          title={isFs ? "Sair do Fullscreen do mapa" : "Fullscreen do mapa"}
          aria-label="Alternar fullscreen do mapa"
        >
          <FontAwesomeIcon icon={isFs ? faCompress : faExpand} className="h-4 w-4" />
        </button>

        {/* Switch Theme */}
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
          title={isDark ? "Mudar para Light" : "Mudar para Dark"}
          aria-label="Alternar tema"
        >
          <FontAwesomeIcon icon={isDark ? faMoon : faSun} className="h-4 w-4" />
          <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
        </button>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
          title="Sair"
          aria-label="Sair"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}

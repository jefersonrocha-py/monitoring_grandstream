// components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { initThemeFromStorage, useThemeStore, type Theme } from "@store/theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

export default function ThemeToggle() {
  const { theme, toggle, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initThemeFromStorage();
  }, []);

  const isLight = (() => {
    if (theme === "light") return true;
    if (theme === "dark") return false;
    if (typeof window !== "undefined" && window.matchMedia) {
      return !window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  })();

  function select(t: Theme) {
    setTheme(t);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        onContextMenu={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="rounded px-3 py-2 bg-brand1 text-white hover:opacity-90 flex items-center gap-2"
        title="Clique: alternar Light/Dark • Botão direito: opções"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={isLight ? faSun : faMoon} />
        <span className="hidden md:inline">{isLight ? "Light" : "Dark"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-lg bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 shadow-lg overflow-hidden z-[500]"
        >
          {(["light", "dark", "system"] as Theme[]).map((opt) => (
            <button
              key={opt}
              onClick={() => select(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${theme === opt ? "font-medium" : ""}`}
              role="menuitem"
            >
              {opt === "light" ? "Claro" : opt === "dark" ? "Escuro" : "Sistema"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

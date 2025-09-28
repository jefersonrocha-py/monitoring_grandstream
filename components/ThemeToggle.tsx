"use client";
import { useEffect } from "react";
import { initThemeFromStorage, useThemeStore } from "@store/theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

export default function ThemeToggle() {
  const { theme, toggle, setTheme } = useThemeStore();

  useEffect(() => {
    initThemeFromStorage();
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(saved);
  }, [setTheme]);

  return (
    <button
      onClick={toggle}
      className="rounded px-3 py-2 bg-brand1 text-white hover:opacity-90 flex items-center gap-2"
      title="Alternar tema"
    >
      <FontAwesomeIcon icon={theme === "light" ? faSun : faMoon} />
      <span className="hidden md:inline">{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}

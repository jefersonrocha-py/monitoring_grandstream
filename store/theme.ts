import { create } from "zustand";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (t) => {
    set({ theme: t });
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", t === "dark");
      localStorage.setItem("theme", t);
    }
  },
  toggle: () => {
    const t = get().theme === "light" ? "dark" : "light";
    get().setTheme(t);
  }
}));

export function initThemeFromStorage() {
  if (typeof window === "undefined") return;
  const saved = (localStorage.getItem("theme") as Theme) || "light";
  document.documentElement.classList.toggle("dark", saved === "dark");
}

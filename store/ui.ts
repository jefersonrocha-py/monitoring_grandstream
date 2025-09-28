import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v })
}));

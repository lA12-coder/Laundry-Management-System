import { create } from "zustand";

/** Admin-only preference (public site stays light). */
export const THEME_STORAGE_KEY = "fua-admin-theme";

/** @returns {'light' | 'dark'} */
export function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** @returns {'light' | 'dark' | null} */
export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

/** @returns {'light' | 'dark'} */
export function resolveAdminTheme() {
  return getStoredTheme() ?? getSystemTheme();
}

/** Keep marketing / customer pages in light mode on <html>. */
export function ensurePublicLightMode() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.add("light");
  root.setAttribute("data-theme", "light");
  root.style.colorScheme = "light";
}

/** @param {'light' | 'dark'} theme */
export function getAdminThemeRootClass(theme) {
  return theme === "dark" ? "dark" : "";
}

export const useThemeStore = create((set, get) => ({
  theme: typeof window !== "undefined" ? resolveAdminTheme() : "light",

  setTheme: (theme) => {
    if (theme !== "light" && theme !== "dark") return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    ensurePublicLightMode();
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  syncFromStorage: () => {
    const theme = resolveAdminTheme();
    ensurePublicLightMode();
    set({ theme });
  },
}));

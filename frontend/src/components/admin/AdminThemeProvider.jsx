import { useEffect } from "react";
import {
  ensurePublicLightMode,
  getStoredTheme,
  getSystemTheme,
  useThemeStore,
} from "../../stores/useThemeStore";

/**
 * Syncs admin theme state; never applies .dark to <html> (public pages stay light).
 */
export default function AdminThemeProvider({ children }) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const syncFromStorage = useThemeStore((s) => s.syncFromStorage);

  useEffect(() => {
    syncFromStorage();
    ensurePublicLightMode();
  }, [syncFromStorage]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!getStoredTheme()) {
        setTheme(getSystemTheme());
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [setTheme]);

  return children;
}

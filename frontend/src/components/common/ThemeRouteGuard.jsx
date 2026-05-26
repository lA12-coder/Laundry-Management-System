import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ensurePublicLightMode } from "../../stores/useThemeStore";

/** Strips document-level dark mode when leaving the admin shell. */
export default function ThemeRouteGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) {
      ensurePublicLightMode();
    }
  }, [pathname]);

  return null;
}

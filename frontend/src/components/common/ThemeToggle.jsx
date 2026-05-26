import { Moon, Sun } from "lucide-react";
import { cn } from "../../lib/utils";
import { useThemeStore } from "../../stores/useThemeStore";

/**
 * Accessible theme switcher — Sun in light mode, Moon in dark mode.
 *
 * @param {object} props
 * @param {'default' | 'header' | 'header-brand' | 'admin'} [props.variant]
 * @param {string} [props.className]
 */
export default function ThemeToggle({ variant = "default", className = "" }) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  const variantStyles = {
    default:
      "rounded-full p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-cyan-400 dark:hover:bg-zinc-700",
    header:
      "rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-cyan-400 dark:hover:bg-zinc-800/80",
    "header-brand":
      "rounded-full p-2 text-white/90 hover:bg-white/15 dark:text-cyan-300 dark:hover:bg-zinc-800/50",
    admin:
      "rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-cyan-400 dark:hover:bg-zinc-800 dark:hover:text-cyan-300",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
        variantStyles[variant] ?? variantStyles.default,
        className,
      )}
    >
      <span className="relative block h-5 w-5">
        {isDark ? (
          <Sun
            size={20}
            className="absolute inset-0 rotate-0 scale-100 opacity-100 transition-all duration-300 text-amber-400"
            aria-hidden
          />
        ) : (
          <Moon
            size={20}
            className="absolute inset-0 rotate-0 scale-100 opacity-100 transition-all duration-300"
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}

/**
 * Shared Tailwind class bundles for consistent light/dark surfaces.
 * Apply on layout shells, cards, tables, modals, and forms.
 */
export const themeSurfaces = {
  page: "bg-slate-50 text-slate-950 dark:bg-zinc-900 dark:text-slate-100",
  elevated: "bg-white dark:bg-zinc-800/95 border border-slate-200 dark:border-zinc-700/80",
  muted: "bg-slate-100 dark:bg-zinc-800/60",
  input:
    "bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 text-slate-950 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500",
  heading: "text-slate-950 dark:text-slate-100",
  subtext: "text-slate-600 dark:text-slate-400",
  link: "text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300",
  accentBadge:
    "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40",
};

export const themeAccent = {
  primary: "bg-[#4c84a4] hover:bg-[#3a6680] dark:bg-cyan-600 dark:hover:bg-cyan-500",
  vibrant: "text-cyan-500 dark:text-cyan-400",
};

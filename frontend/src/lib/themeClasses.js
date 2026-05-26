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

/** Admin dark theme — matches dashboard KPI/chart cards (gray-900 on zinc-950). */
export const adminSurface = {
  card: "rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm",
  cardFlat: "rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900",
  muted: "bg-gray-50 dark:bg-gray-800/60",
  mutedHover: "hover:bg-gray-50/80 dark:hover:bg-gray-800/50",
  heading: "text-gray-900 dark:text-gray-100",
  subtext: "text-gray-500 dark:text-gray-400",
  faint: "text-gray-400 dark:text-gray-500",
  label: "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider",
  code: "text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-800 dark:text-gray-200",
  input:
    "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none",
  inputDisabled:
    "disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400",
  dashedEmpty:
    "rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500",
  alertWarning:
    "text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900",
  btnGhost: "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
  btnOutline:
    "border border-[#4c84a4] dark:border-sky-500 text-[#4c84a4] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-sky-950/40",
};

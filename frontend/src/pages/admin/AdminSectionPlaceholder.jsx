import { Link } from "react-router-dom";
import { Construction, ArrowRight } from "lucide-react";

/**
 * Temporary shell for admin sections scheduled for redesign.
 * Replace this file (or the route import) when the improved module ships.
 */
export default function AdminSectionPlaceholder({
  title,
  description,
  primaryHref = "/admin/orders",
  primaryLabel = "Open order workspace",
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 sm:p-12 text-center max-w-2xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-[#4c84a4]/10 dark:bg-sky-500/20 flex items-center justify-center mx-auto mb-5">
        <Construction className="w-7 h-7 text-[#4c84a4]" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">
        Coming soon
      </p>
      <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{description}</p>
      <Link
        to={primaryHref}
        className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold transition-colors"
      >
        {primaryLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

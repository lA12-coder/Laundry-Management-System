import { Banknote, Package, TrendingUp, Zap } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatETB } from "../../../lib/currency";
import { SkeletonCard } from "../orders/SkeletonCard";

const KPI_CONFIG = [
  {
    key: "gross_revenue",
    label: "Gross revenue",
    icon: Banknote,
    format: (v) => formatETB(v),
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "total_orders",
    label: "Orders",
    icon: Package,
    format: (v) => Number(v || 0).toLocaleString(),
    accent: "text-[#4c84a4] dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    key: "platform_margin",
    label: "Platform margin",
    icon: TrendingUp,
    format: (v) => formatETB(v),
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    key: "urgent_orders",
    label: "Urgent orders",
    icon: Zap,
    format: (v) => Number(v || 0).toLocaleString(),
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
];

export default function DashboardKpiStrip({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CONFIG.map((k) => (
          <SkeletonCard key={k.key} lines={2} className="min-h-[96px] dark:border-gray-800 dark:bg-gray-900" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const value = metrics?.[kpi.key] ?? 0;
        return (
          <div
            key={kpi.key}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {kpi.label}
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                  {kpi.format(value)}
                </p>
              </div>
              <div className={cn("p-2 rounded-xl", kpi.bg)}>
                <Icon size={20} className={kpi.accent} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

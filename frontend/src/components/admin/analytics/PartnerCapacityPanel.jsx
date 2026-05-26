import { AlertTriangle, Building2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatETB } from "../../../lib/currency";
import { SkeletonCard } from "../orders/SkeletonCard";

function CapacityGauge({ partner }) {
  const pct = Math.min(100, partner.utilization_pct ?? 0);
  const atRisk = partner.at_risk;
  const tone = atRisk
    ? "text-red-600 dark:text-red-400"
    : pct >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";
  const barTone = atRisk
    ? "bg-red-500"
    : pct >= 60
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {partner.business_name}
        </p>
        <span className={cn("text-xs font-black tabular-nums shrink-0", tone)}>
          {pct}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 dark:text-gray-400">
        <span>
          {partner.completed_in_period ?? 0} / {partner.capacity_budget ?? 0} capacity
        </span>
        <span>{partner.capacity_per_day ?? 0}/day limit</span>
        <span>{formatETB(partner.total_earnings)} earned</span>
      </div>
      {atRisk && (
        <p className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
          <AlertTriangle size={12} />
          Bottleneck risk — near daily capacity
        </p>
      )}
    </div>
  );
}

export default function PartnerCapacityPanel({ partners = [], isLoading }) {
  if (isLoading) {
    return (
      <SkeletonCard
        lines={6}
        className="min-h-[320px] dark:border-gray-800 dark:bg-gray-900"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50">
          <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
            Partner capacity tracking
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Utilization vs capacity_per_day for the selected window
          </p>
        </div>
      </div>

      {partners.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
          No partner data in this period.
        </p>
      ) : (
        <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="rounded-xl border border-gray-50 dark:border-gray-800 p-3"
            >
              <CapacityGauge partner={partner} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  PiggyBank,
  Truck,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatMoneyETB } from "../../../lib/money";
import { SkeletonCard } from "../orders/SkeletonCard";
import { fetchLedgerSummary, financialQueryKeys } from "../../../services/financialApi";
import {
  describeRiderFeeConfig,
  fetchSystemConfig,
  systemConfigQueryKeys,
} from "../../../services/systemConfigApi";

const METRIC_CARDS = [
  {
    key: "gross_revenue",
    label: "Gross revenue",
    description: "Aggregate line value across settled orders",
    icon: Banknote,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "platform_fees",
    label: "Fua commission",
    description: "Fua price − partner price − rider fee (per order)",
    icon: Building2,
    accent: "text-[#4c84a4] dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    key: "logistics_payouts",
    label: "Logistics payouts",
    description: "Logistics fees recorded on settled orders",
    icon: Truck,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    key: "net_operational_profit",
    label: "Net operational profit",
    description: "Platform fees minus logistics overhead",
    icon: PiggyBank,
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
];

function MetricCard({ metric, summary, isLoading }) {
  const Icon = metric.icon;
  if (isLoading) {
    return <SkeletonCard lines={2} className="min-h-[108px] dark:border-gray-800 dark:bg-gray-900" />;
  }
  const value = summary?.[metric.key] ?? "0";
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {metric.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
            {formatMoneyETB(value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metric.description}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", metric.bg)}>
          <Icon size={22} className={metric.accent} />
        </div>
      </div>
    </div>
  );
}

/**
 * Live split calculator dashboard — aggregated ledger metrics.
 */
export default function LedgerSummary({ filterParams = {} }) {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: financialQueryKeys.summary(filterParams),
    queryFn: () => fetchLedgerSummary(filterParams),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const { data: systemConfig } = useQuery({
    queryKey: systemConfigQueryKeys.all,
    queryFn: fetchSystemConfig,
    staleTime: 60_000,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Split ledger summary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {describeRiderFeeConfig(systemConfig)} · Fua commission = total − partner − rider
          </p>
        </div>
        {!isLoading && summary && (
          <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
            <span className="font-medium">{summary.transaction_count}</span> settled
            transactions · Partner payouts{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatMoneyETB(summary.partner_payouts)}
            </span>
          </p>
        )}
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3">
          Unable to load ledger summary. Check your connection and try again.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRIC_CARDS.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            summary={summary}
            isLoading={isLoading}
          />
        ))}
      </div>

    </section>
  );
}

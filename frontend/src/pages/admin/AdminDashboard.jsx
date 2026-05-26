import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { DEFAULT_DASHBOARD_PERIOD } from "../../constants/dashboardPeriods";
import { fetchDashboardMetrics, dashboardQueryKeys } from "../../services/dashboardApi";
import PeriodSelector from "../../components/admin/analytics/PeriodSelector";
import DashboardKpiStrip from "../../components/admin/analytics/DashboardKpiStrip";
import RevenueLineChart from "../../components/admin/analytics/RevenueLineChart";
import OrderLoadBarChart from "../../components/admin/analytics/OrderLoadBarChart";
import RiderEfficiencyList from "../../components/admin/analytics/RiderEfficiencyList";
import PartnerCapacityPanel from "../../components/admin/analytics/PartnerCapacityPanel";

export default function AdminDashboard() {
  const [period, setPeriod] = useState(DEFAULT_DASHBOARD_PERIOD);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: dashboardQueryKeys.metrics(period),
    queryFn: () => fetchDashboardMetrics(period),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="text-[#4c84a4]" size={26} />
            Business intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-2xl">
            Operational telemetry from{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
              DashboardMetricsViewSet
            </code>
            — revenue acceleration, load mix, rider efficiency, and partner capacity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold",
              "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50",
            )}
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
          Could not load dashboard metrics. Check your connection and try refresh.
        </p>
      )}

      <DashboardKpiStrip metrics={data?.metrics} isLoading={isLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueLineChart data={data?.revenue_trend} isLoading={isLoading} />
        <OrderLoadBarChart data={data?.order_volume} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RiderEfficiencyList riders={data?.riders} isLoading={isLoading} />
        <PartnerCapacityPanel partners={data?.partners} isLoading={isLoading} />
      </div>
    </div>
  );
}

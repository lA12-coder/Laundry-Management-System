import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, chartAxisProps } from "./chartTheme";
import { SkeletonCard } from "../orders/SkeletonCard";

function LoadTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const regular = payload.find((p) => p.dataKey === "regular")?.value ?? 0;
  const urgent = payload.find((p) => p.dataKey === "urgent")?.value ?? 0;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-[#4c84a4]">Regular: {regular}</p>
      <p className="text-amber-600 dark:text-amber-400">Urgent: {urgent}</p>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Total: {regular + urgent}</p>
    </div>
  );
}

export default function OrderLoadBarChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <SkeletonCard
        lines={4}
        className="min-h-[320px] dark:border-gray-800 dark:bg-gray-900"
      />
    );
  }

  const hasData = data.some((d) => d.regular > 0 || d.urgent > 0);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
          Order volume load balancing
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Regular vs premium urgent workflow mix
        </p>
      </div>

      {!hasData ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
          No orders in this period yet.
        </p>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
              <XAxis dataKey="label" {...chartAxisProps} interval="preserveStartEnd" />
              <YAxis {...chartAxisProps} allowDecimals={false} width={36} />
              <Tooltip content={<LoadTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) =>
                  value === "urgent" ? "Urgent (premium)" : "Regular"
                }
              />
              <Bar
                dataKey="regular"
                stackId="load"
                fill={CHART_COLORS.primary}
                radius={[0, 0, 0, 0]}
                name="regular"
              />
              <Bar
                dataKey="urgent"
                stackId="load"
                fill={CHART_COLORS.urgent}
                radius={[4, 4, 0, 0]}
                name="urgent"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

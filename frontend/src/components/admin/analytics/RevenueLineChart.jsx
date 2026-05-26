import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatETB } from "../../../lib/currency";
import { CHART_COLORS, chartAxisProps, chartTooltipStyle } from "./chartTheme";
import { SkeletonCard } from "../orders/SkeletonCard";

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-lg text-xs"
      style={chartTooltipStyle.contentStyle}
    >
      <p className="font-bold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-[#4c84a4] font-semibold mt-1">
        {formatETB(point?.revenue)}
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        {point?.orders ?? 0} order{(point?.orders ?? 0) !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function RevenueLineChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <SkeletonCard
        lines={4}
        className="min-h-[320px] dark:border-gray-800 dark:bg-gray-900"
      />
    );
  }

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
          Gross revenue acceleration
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Daily revenue cycles with order volume context
        </p>
      </div>

      {!hasData ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
          No revenue in this period yet.
        </p>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                className="dark:opacity-30"
                vertical={false}
              />
              <XAxis dataKey="label" {...chartAxisProps} interval="preserveStartEnd" />
              <YAxis
                {...chartAxisProps}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: CHART_COLORS.primaryDark }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

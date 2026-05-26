/** Shared Recharts palette — light + dark admin surfaces */
export const CHART_COLORS = {
  primary: "#4c84a4",
  primaryDark: "#3a6680",
  urgent: "#f59e0b",
  urgentDark: "#d97706",
  success: "#10b981",
  grid: "#e5e7eb",
  gridDark: "#374151",
  axis: "#6b7280",
  axisDark: "#9ca3af",
  tooltipBg: "#ffffff",
  tooltipBgDark: "#1f2937",
  tooltipBorder: "#e5e7eb",
  tooltipBorderDark: "#374151",
};

export const chartTooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontSize: "12px",
  },
  labelStyle: { fontWeight: 700, color: "#111827" },
};

export const chartAxisProps = {
  tick: { fill: CHART_COLORS.axis, fontSize: 11 },
  axisLine: { stroke: CHART_COLORS.grid },
  tickLine: false,
};

import api from "../API/axios";

export const dashboardQueryKeys = {
  all: ["dashboard"],
  metrics: (period) => ["dashboard", "metrics", period],
};

export async function fetchDashboardMetrics(period = "7d") {
  const { data } = await api.get("/admin/dashboard-metrics/", {
    params: { period },
  });
  return data?.data ?? data;
}

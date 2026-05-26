import api from "../API/axios";

export const systemConfigQueryKeys = {
  all: ["systemConfig"],
};

/** Query keys invalidated when operational preferences change. */
export const systemConfigInvalidationTargets = [
  systemConfigQueryKeys.all,
  ["financial"],
  ["dashboard"],
  ["customerOrders"],
  ["notifications"],
];

export async function fetchSystemConfig() {
  const { data } = await api.get("/admin/system-config/");
  return data?.data ?? data;
}

export async function updateSystemConfig(payload) {
  const { data } = await api.patch("/admin/system-config/", payload);
  return data?.data ?? data;
}

/** Human-readable rider fee rule for dashboards. */
export function describeRiderFeeConfig(config) {
  if (!config) return "Rider fee: configured in system settings";
  if (config.rider_fee_mode === "fixed") {
    return `Rider fee: ETB ${config.rider_fee_fixed_amount} per order (fixed)`;
  }
  return `Rider fee: ${config.rider_fee_percent}% of order total`;
}

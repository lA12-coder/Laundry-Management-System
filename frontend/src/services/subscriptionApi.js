import api from "../API/axios";

export const subscriptionQueryKeys = {
  plans: ["subscriptions", "plans"],
  customer: ["subscriptions", "customer"],
  adminQueue: (params = {}) => ["subscriptions", "admin", params],
};

export async function fetchSubscriptionPlans() {
  const { data } = await api.get("/accounts/subscription-plans/");
  return data?.data ?? data ?? [];
}

export async function submitSubscriptionCheckout({ planId, receiptFile }) {
  const form = new FormData();
  form.append("plan_id", String(planId));
  form.append("receipt_image", receiptFile);
  const { data } = await api.post("/accounts/subscriptions/checkout/", form);
  return data?.data ?? data;
}

export async function fetchMySubscriptions() {
  const { data } = await api.get("/accounts/subscriptions/me/");
  return data?.data ?? data ?? [];
}

export async function fetchAdminSubscriptionQueue(params = {}) {
  const { data } = await api.get("/admin/subscriptions/", { params });
  const payload = data?.results ? data : data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  return payload?.results ?? [];
}

export async function approveSubscription(id, note = "") {
  const { data } = await api.post(`/admin/subscriptions/${id}/approve/`, { note });
  return data?.data ?? data;
}

export async function rejectSubscription(id, note = "") {
  const { data } = await api.post(`/admin/subscriptions/${id}/reject/`, { note });
  return data?.data ?? data;
}

export async function disableSubscription(id, note = "") {
  const { data } = await api.post(`/admin/subscriptions/${id}/disable/`, { note });
  return data?.data ?? data;
}

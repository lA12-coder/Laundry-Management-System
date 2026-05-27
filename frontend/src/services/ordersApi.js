import api from "../API/axios";

/**
 * @param {Record<string, string|number|undefined>} params
 */
export async function fetchAdminOrdersPage(params = {}) {
  const { data } = await api.get("/admin/orders/", { params });
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  if (data?.results) return data;
  if (data?.data?.results) return data.data;
  return { count: 0, next: null, previous: null, results: [] };
}

export async function fetchOrderDetail(orderId) {
  const { data } = await api.get(`/admin/orders/${orderId}/`);
  return data?.data ?? data;
}

export async function markOrderReceived(orderId, payload) {
  const { data } = await api.post(`/orders/${orderId}/mark-received/`, payload);
  return data?.data ?? data;
}

export async function fetchOrderFormOptions() {
  const { data } = await api.get("/admin/orders/form-options/");
  return data?.data ?? data;
}

export async function overrideOrderStatus(orderId, status) {
  const { data } = await api.post(`/admin/orders/${orderId}/override-status/`, {
    status,
  });
  return data?.data ?? data;
}

export async function reassignOrderRider(orderId, riderId) {
  const { data } = await api.post(`/admin/orders/${orderId}/reassign-rider/`, {
    rider: riderId,
  });
  return data?.data ?? data;
}

export async function assignOrderPartner(orderId, partnerId) {
  const { data } = await api.patch(`/admin/orders/${orderId}/assign-partner/`, {
    partner: partnerId,
  });
  return data?.data ?? data;
}

export async function fetchPartnerOrders(params = {}) {
  const { data } = await api.get("/partner/orders/", { params });
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  if (data?.results) return data;
  if (data?.data?.results) return data.data;
  return { count: 0, next: null, previous: null, results: [] };
}

export async function updatePartnerOrderStatus(orderId, status) {
  const { data } = await api.patch(`/partner/orders/${orderId}/update-status/`, {
    status,
  });
  return data?.data ?? data;
}

export async function fetchPartnerAnalytics() {
  const { data } = await api.get("/partner/orders/analytics/");
  return data?.data ?? data;
}

export async function fetchPartnerLedger() {
  const { data } = await api.get("/partner/orders/ledger/");
  return data?.data ?? data;
}

export async function fetchPartnerSettlementSnapshot(partnerId) {
  const { data } = await api.get("/admin/partner-settlements/", {
    params: { partner_id: partnerId },
  });
  return data?.data ?? data;
}

export async function clearPartnerSettlement(partnerId) {
  const { data } = await api.post("/admin/partner-settlements/", {
    partner_id: partnerId,
  });
  return data?.data ?? data;
}

export async function fetchPartnerSettlementLedger(partnerId) {
  const { data } = await api.get("/admin/partner-settlements/ledger/", {
    params: partnerId ? { partner_id: partnerId } : {},
  });
  return data?.data ?? data;
}

export async function fetchSettlementPartners() {
  const { data } = await api.get("/admin/partner-settlements/");
  return data?.data?.partners ?? data?.partners ?? [];
}

export const orderQueryKeys = {
  all: ["adminOrders"],
  list: (params) => ["adminOrders", "list", params],
  detail: (id) => ["adminOrders", "detail", id],
  formOptions: ["adminOrders", "formOptions"],
  partnerOrders: (params) => ["partnerOrders", params],
  partnerAnalytics: ["partnerOrders", "analytics"],
  partnerLedger: ["partnerOrders", "ledger"],
  settlementPartners: ["partnerSettle", "partners"],
  settlementSnapshot: (partnerId) => ["partnerSettle", "snapshot", partnerId],
  settlementLedger: (partnerId) => ["partnerSettle", "ledger", partnerId],
};

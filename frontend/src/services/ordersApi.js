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

export const orderQueryKeys = {
  all: ["adminOrders"],
  list: (params) => ["adminOrders", "list", params],
  detail: (id) => ["adminOrders", "detail", id],
  formOptions: ["adminOrders", "formOptions"],
};

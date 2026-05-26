import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE_URL });

// ─── Auth Interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Orders ──────────────────────────────────────────────────────────────────
export const fetchAdminOrders = async (params) => {
  const { data } = await api.get('/admin/orders/', { params });
  return data;
};

export const fetchOrderDetail = async (orderId) => {
  const { data } = await api.get(`/admin/orders/${orderId}/`);
  return data;
};

export const createAdminOrder = async (orderData) => {
  const { data } = await api.post('/admin/orders/', orderData);
  return data;
};

export const updateAdminOrder = async (orderId, orderData) => {
  const { data } = await api.put(`/admin/orders/${orderId}/`, orderData);
  return data;
};

export const deleteAdminOrder = async (orderId) => {
  await api.delete(`/admin/orders/${orderId}/`);
};

export const overrideOrderStatus = async (orderId, newStatus) => {
  const { data } = await api.post(`/admin/orders/${orderId}/override-status/`, { status: newStatus });
  return data;
};

export const reassignRider = async (orderId, riderId) => {
  const { data } = await api.post(`/admin/orders/${orderId}/reassign-rider/`, { rider: riderId });
  return data;
};

export const fetchFormOptions = async () => {
  const { data } = await api.get('/admin/orders/form-options/');
  return data?.data ?? data;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const fetchDashboardMetrics = async (period = '7d') => {
  const { data } = await api.get('/admin/dashboard-metrics/', { params: { period } });
  return data;
};

// ─── Financial ───────────────────────────────────────────────────────────────
export const fetchAdminFinancials = async (params) => {
  const { data } = await api.get('/admin/transactions/', { params });
  return data;
};

// ─── Partners ────────────────────────────────────────────────────────────────
export const fetchAdminPartners = async (params) => {
  const { data } = await api.get('/admin/partners/', { params });
  return data;
};

export const approvePartner = async (partnerId) => {
  const { data } = await api.post(`/admin/partners/${partnerId}/approve/`);
  return data;
};

export const deactivatePartner = async (partnerId) => {
  const { data } = await api.post(`/admin/partners/${partnerId}/deactivate/`);
  return data;
};

// ─── Users (Customers + Riders) ──────────────────────────────────────────────
export const fetchAdminUsers = async (params) => {
  const { data } = await api.get('/admin/users/', { params });
  return data;
};

// ─── Price List ──────────────────────────────────────────────────────────────
export const fetchPriceList = async () => {
  const { data } = await api.get('/price-list/');
  return data;
};

export default api;

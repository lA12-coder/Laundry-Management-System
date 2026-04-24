import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchAdminOrders = async (params) => {
  const { data } = await api.get('/admin/orders/', { params });
  return data;
};

export const overrideOrderStatus = async (orderId, status) => {
  const { data } = await api.post(`/admin/orders/${orderId}/override-status/`, { status });
  return data;
};

export const reassignRider = async (orderId, rider_id) => {
  const { data } = await api.post(`/admin/orders/${orderId}/reassign-rider/`, { rider: rider_id });
  return data;
};

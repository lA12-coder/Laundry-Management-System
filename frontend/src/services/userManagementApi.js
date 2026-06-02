import api from "../API/axios";

export const userManagementQueryKeys = {
  all: (params = {}) => ["admin-users", params],
};

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function fetchAdminUsers(params = {}) {
  const { data } = await api.get("/admin/users/", { params });
  return unwrapList(data);
}

export async function createAdminUser(payload) {
  const { data } = await api.post("/admin/users/", payload);
  return data?.data ?? data;
}

export async function updateAdminUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}/`, payload);
  return data?.data ?? data;
}

export async function deleteAdminUser(id) {
  await api.delete(`/admin/users/${id}/`);
}


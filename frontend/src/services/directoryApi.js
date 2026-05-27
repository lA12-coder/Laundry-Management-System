import api from "../API/axios";

function normalizeCollectionPayload(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export const directoryQueryKeys = {
  customers: (search = "") => ["adminDirectory", "customers", search],
  riders: (search = "") => ["adminDirectory", "riders", search],
  partners: (search = "") => ["adminDirectory", "partners", search],
};

export async function fetchCustomerDirectory(search = "") {
  const params = {};
  if (search.trim()) params.search = search.trim();
  const { data } = await api.get("/admin/customers/", { params });
  return normalizeCollectionPayload(data);
}

export async function fetchRiderDirectory(search = "") {
  const params = {};
  if (search.trim()) params.search = search.trim();
  const { data } = await api.get("/admin/riders/", { params });
  return normalizeCollectionPayload(data);
}

export async function createRider(payload) {
  const { data } = await api.post("/admin/riders/", payload);
  return data?.data ?? data;
}

export async function updateRider(riderId, payload) {
  const { data } = await api.patch(`/admin/riders/${riderId}/`, payload);
  return data?.data ?? data;
}

export async function deleteRider(riderId) {
  await api.delete(`/admin/riders/${riderId}/`);
}

export async function fetchPartnerDirectory(search = "") {
  const params = {};
  if (search.trim()) params.search = search.trim();
  const { data } = await api.get("/admin/partners/", { params });
  return normalizeCollectionPayload(data);
}

export async function togglePartnerApproval(partnerId) {
  const { data } = await api.post(`/admin/partners/${partnerId}/toggle_approval/`);
  return data?.data ?? data;
}

export async function createPartner(payload) {
  const { data } = await api.post("/admin/partners/", payload);
  return data?.data ?? data;
}

export async function deletePartner(partnerId) {
  await api.delete(`/admin/partners/${partnerId}/`);
}

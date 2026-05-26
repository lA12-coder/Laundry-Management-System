import api from "../API/axios";

export const riderQueryKeys = {
  jobs: (coords) => ["riderJobs", coords?.lat ?? null, coords?.lng ?? null],
  job: (id) => ["riderJobs", "detail", id],
};

/**
 * @param {{ lat?: number, lng?: number }} [coords]
 */
export async function fetchRiderJobs(coords = {}) {
  const params = {};
  if (coords.lat != null && coords.lng != null) {
    params.lat = coords.lat;
    params.lng = coords.lng;
  }
  const { data } = await api.get("/rider/jobs/", { params });
  return data?.data ?? data;
}

export async function fetchRiderJob(orderId, coords = {}) {
  const params = {};
  if (coords.lat != null && coords.lng != null) {
    params.lat = coords.lat;
    params.lng = coords.lng;
  }
  const { data } = await api.get(`/rider/jobs/${orderId}/`, { params });
  return data?.data ?? data;
}

/** Rider-scoped accept — unlocks contact/address (not admin reassign endpoint). */
export async function acceptRiderJob(orderId) {
  const { data } = await api.post(`/rider/jobs/${orderId}/accept/`);
  return data?.data ?? data;
}

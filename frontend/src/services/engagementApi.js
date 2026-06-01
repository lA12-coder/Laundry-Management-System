import api from "../API/axios";

export const engagementQueryKeys = {
  publicTestimonials: ["publicTestimonials"],
  publicLocations: ["publicLocations"],
  adminTestimonials: ["adminTestimonials"],
  adminLocations: ["adminLaundryLocations"],
};

export async function fetchPublicTestimonials() {
  const { data } = await api.get("/testimonials/public/");
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function submitContactForm(payload) {
  const { data } = await api.post("/contact/submit/", payload);
  return data;
}

export async function fetchPublicLaundryLocations() {
  const { data } = await api.get("/locations/public/");
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function fetchAdminTestimonials() {
  const { data } = await api.get("/admin/testimonials/");
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function updateTestimonialApproval(id, isApproved) {
  const { data } = await api.patch(`/admin/testimonials/${id}/`, {
    is_approved_for_public: isApproved,
  });
  return data?.data ?? data;
}

export async function fetchAdminLaundryLocations() {
  const { data } = await api.get("/admin/laundry-locations/");
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function createLaundryLocation(payload) {
  const { data } = await api.post("/admin/laundry-locations/", payload);
  return data?.data ?? data;
}

export async function toggleLaundryLocation(id, isActive) {
  const { data } = await api.patch(`/admin/laundry-locations/${id}/`, {
    is_active: isActive,
  });
  return data?.data ?? data;
}

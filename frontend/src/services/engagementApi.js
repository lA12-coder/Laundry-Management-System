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

export async function createAdminTestimonial(payload) {
  const form = new FormData();
  form.append("customer_name", payload.customer_name);
  form.append("rating", String(payload.rating));
  form.append("review_text", payload.review_text);
  form.append("is_approved_for_public", payload.is_approved_for_public ? "true" : "false");
  if (payload.customer_image instanceof File) {
    form.append("customer_image", payload.customer_image);
  }
  const { data } = await api.post("/admin/testimonials/", form);
  return data?.data ?? data;
}

export async function updateAdminTestimonial(id, payload) {
  const form = new FormData();
  if (payload.customer_name !== undefined) form.append("customer_name", payload.customer_name);
  if (payload.rating !== undefined) form.append("rating", String(payload.rating));
  if (payload.review_text !== undefined) form.append("review_text", payload.review_text);
  if (payload.is_approved_for_public !== undefined) {
    form.append(
      "is_approved_for_public",
      payload.is_approved_for_public ? "true" : "false",
    );
  }
  if (payload.customer_image instanceof File) {
    form.append("customer_image", payload.customer_image);
  }
  const { data } = await api.patch(`/admin/testimonials/${id}/`, form);
  return data?.data ?? data;
}

export async function deleteAdminTestimonial(id) {
  await api.delete(`/admin/testimonials/${id}/`);
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

import api from "../API/axios";

export const categoryQueryKeys = {
  all: ["priceCategories"],
  admin: ["priceCategories", "admin"],
};

function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  return data?.data ?? data;
}

export async function fetchPriceCategories() {
  const { data } = await api.get("/admin/price-categories/");
  return unwrap(data);
}

export async function createPriceCategory(payload) {
  const { data } = await api.post("/admin/price-categories/", payload);
  return unwrap(data);
}

export async function updatePriceCategory(id, payload) {
  const { data } = await api.patch(`/admin/price-categories/${id}/`, payload);
  return unwrap(data);
}

export async function deletePriceCategory(id) {
  await api.delete(`/admin/price-categories/${id}/`);
}

/** Sort categories for matrix display */
export function sortCategories(categories = []) {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

export function getCategoryLabel(categories, categoryId) {
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.name ?? "Uncategorized";
}

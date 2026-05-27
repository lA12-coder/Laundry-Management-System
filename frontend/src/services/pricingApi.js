import api from "../API/axios";

export const pricingQueryKeys = {
  all: ["priceList"],
  admin: ["priceList", "admin"],
};

const MULTIPART_SCALAR_FIELDS = [
  "cloth_name",
  "category",
  "size",
  "fua_price",
  "partner_price",
  "is_active",
];

function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  return data?.data ?? data;
}

function isUploadableFile(value) {
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  return false;
}

function needsMultipart(payload) {
  return isUploadableFile(payload?.image) || payload?.clear_image === true;
}

function appendFormValue(fd, key, value) {
  if (value === undefined || value === null) return;
  if (typeof value === "number" && Number.isNaN(value)) return;
  if (key === "is_active") {
    fd.append(key, value ? "1" : "0");
    return;
  }
  fd.append(key, String(value));
}

function buildPriceListFormData(payload) {
  const fd = new FormData();

  if (isUploadableFile(payload.image)) {
    const file = payload.image;
    const name = file.name || "catalogue.jpg";
    fd.append("image", file, name);
  }

  if (payload.clear_image) {
    fd.append("clear_image", "1");
  }

  for (const key of MULTIPART_SCALAR_FIELDS) {
    appendFormValue(fd, key, payload[key]);
  }

  return fd;
}

function stripUploadKeys(payload) {
  const { image, image_url, clear_image, ...rest } = payload;
  return rest;
}

const multipartRequestConfig = {
  transformRequest: [
    (data, headers) => {
      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
        headers.delete("content-type");
      } else if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
      return data;
    },
  ],
};

/** Invalidate catalogue + categories after structural changes */
export function invalidatePricingQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: pricingQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: ["priceCategories"] });
}

export async function fetchAdminPriceList() {
  const { data } = await api.get("/admin/price-list/");
  const entries = unwrap(data);
  return Array.isArray(entries)
    ? entries.filter((entry) => entry?.is_active !== false)
    : [];
}

export async function createPriceListEntry(payload) {
  if (needsMultipart(payload)) {
    const { data } = await api.post(
      "/admin/price-list/",
      buildPriceListFormData(payload),
      multipartRequestConfig,
    );
    return unwrap(data);
  }
  const { data } = await api.post("/admin/price-list/", stripUploadKeys(payload));
  return unwrap(data);
}

export async function updatePriceListEntry(id, payload) {
  if (needsMultipart(payload)) {
    const { data } = await api.patch(
      `/admin/price-list/${id}/`,
      buildPriceListFormData(payload),
      multipartRequestConfig,
    );
    return unwrap(data);
  }
  const { data } = await api.patch(
    `/admin/price-list/${id}/`,
    stripUploadKeys(payload),
  );
  return unwrap(data);
}

export async function deactivatePriceListEntry(id) {
  await api.delete(`/admin/price-list/${id}/`);
}

export async function bulkUpdatePrices(payload) {
  const { data } = await api.post("/admin/price-list/bulk-update/", payload);
  return data?.data ?? data;
}

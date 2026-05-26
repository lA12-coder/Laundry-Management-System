const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/** Origin for uploaded media (strips trailing /api). */
export function getMediaOrigin() {
  return API_BASE.replace(/\/api\/?$/, "");
}

/**
 * Resolve catalogue image from API (absolute URL, relative /media/, or blob preview).
 * @param {string|null|undefined} image
 * @returns {string|null}
 */
export function resolveCatalogImageUrl(image) {
  if (!image) return null;
  if (
    typeof image === "string" &&
    (image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("blob:"))
  ) {
    return image;
  }
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${getMediaOrigin()}${path}`;
}

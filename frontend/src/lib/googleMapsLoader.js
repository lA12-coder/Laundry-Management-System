const SCRIPT_ID = "fualaundry-google-maps";
const READY_TIMEOUT_MS = 15_000;

function hasUsableMapsNamespace() {
  const maps = window.google?.maps;
  return Boolean(maps && (typeof maps.Map === "function" || typeof maps.importLibrary === "function"));
}

function waitForMapsReady(timeoutMs = READY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (hasUsableMapsNamespace()) {
        resolve(window.google.maps);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Google Maps namespace did not initialize in time."));
        return;
      }
      window.requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Loads Google Maps JavaScript API once per session.
 * @returns {Promise<typeof google.maps>}
 */
export function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY is not configured."),
    );
  }

  if (hasUsableMapsNamespace()) {
    return Promise.resolve(window.google.maps);
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    if (hasUsableMapsNamespace() || existing.getAttribute("data-loaded") === "true") {
      return waitForMapsReady();
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => {
        waitForMapsReady().then(resolve).catch(reject);
      });
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps script failed to load.")),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&v=weekly`;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      waitForMapsReady().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });
}

export function hasGoogleMapsKey() {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}

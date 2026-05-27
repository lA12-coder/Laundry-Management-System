/**
 * @returns {Promise<{ lat: number, lng: number, accuracy: number | null, timestamp: number | null }>}
 */
function requestPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          timestamp: Number.isFinite(pos.timestamp) ? pos.timestamp : null,
        }),
      (err) => reject(err),
      options,
    );
  });
}

async function readGeoPermissionState() {
  try {
    if (!navigator.permissions?.query) return null;
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status?.state || null;
  } catch {
    return null;
  }
}

export async function getRiderPosition() {
  const permissionState = await readGeoPermissionState();
  if (permissionState === "denied") {
    const deniedError = new Error(
      "Location permission denied. Enable location in browser site settings.",
    );
    deniedError.code = 1;
    throw deniedError;
  }

  try {
    return await requestPosition({
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 0,
    });
  } catch (err) {
    if (err?.code === 2 || err?.code === 3) {
      return requestPosition({
        enableHighAccuracy: false,
        timeout: 18_000,
        maximumAge: 60_000,
      });
    }
    throw err;
  }
}

/**
 * Pulls multiple high-accuracy samples and returns the most precise one.
 */
export async function getPrecisePosition({
  maxAccuracyMeters = 40,
  attempts = 3,
} = {}) {
  let best = null;
  let lastError = null;
  const totalAttempts = Math.max(1, attempts);

  for (let i = 0; i < totalAttempts; i += 1) {
    try {
      const sample = await getRiderPosition();
      if (!best || (sample.accuracy ?? Infinity) < (best.accuracy ?? Infinity)) {
        best = sample;
      }
      if ((sample.accuracy ?? Infinity) <= maxAccuracyMeters) {
        return sample;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (best) return best;
  throw lastError || new Error("Unable to capture location.");
}

export function watchRiderPosition(onPosition, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error("Geolocation is not supported on this device."));
    return () => {};
  }
  const watcherId = navigator.geolocation.watchPosition(
    (pos) =>
      onPosition?.({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        timestamp: Number.isFinite(pos.timestamp) ? pos.timestamp : null,
      }),
    (err) => onError?.(err),
    {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000,
    },
  );

  return () => navigator.geolocation.clearWatch(watcherId);
}

export function geolocationErrorMessage(error) {
  if (!error) return "Unable to read your location.";
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Location needs a secure origin (https or localhost).";
  }
  if (error.code === 1) return "Location permission denied. Enable browser location access and retry.";
  if (error.code === 2) return "Location unavailable. Try again outdoors.";
  if (error.code === 3) return "Location request timed out. Retry to refresh GPS lock.";
  return error.message || "Geolocation error.";
}

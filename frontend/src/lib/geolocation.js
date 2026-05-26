/**
 * @returns {Promise<{ lat: number, lng: number }>}
 */
export function getRiderPosition() {
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
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

export function geolocationErrorMessage(error) {
  if (!error) return "Unable to read your location.";
  if (error.code === 1) return "Location permission denied. Enable GPS to see distances.";
  if (error.code === 2) return "Location unavailable. Try again outdoors.";
  if (error.code === 3) return "Location request timed out.";
  return error.message || "Geolocation error.";
}

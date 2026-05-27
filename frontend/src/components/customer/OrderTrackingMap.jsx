import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { hasGoogleMapsKey, loadGoogleMaps } from "../../lib/googleMapsLoader";

const DEFAULT_CENTER = { lat: 9.03, lng: 38.74 };

export default function OrderTrackingMap({ order }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!hasGoogleMapsKey()) {
        setError("Google Maps API key is missing.");
        return;
      }
      if (!order?.pickup_latitude || !order?.pickup_longitude) {
        setError("Customer pickup location is not available yet.");
        return;
      }

      try {
        setError("");
        const maps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const MapCtor = maps.Map;
        const MarkerCtor = maps.Marker;
        if (!MapCtor || !MarkerCtor) {
          throw new Error("Google Maps constructors are unavailable.");
        }

        const customerPoint = {
          lat: Number(order.pickup_latitude),
          lng: Number(order.pickup_longitude),
        };
        const riderAvailable =
          order.rider_last_latitude != null && order.rider_last_longitude != null;
        const riderPoint = riderAvailable
          ? {
              lat: Number(order.rider_last_latitude),
              lng: Number(order.rider_last_longitude),
            }
          : null;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new MapCtor(mapRef.current, {
            center: customerPoint || DEFAULT_CENTER,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
          });
        } else {
          mapInstanceRef.current.setCenter(customerPoint || DEFAULT_CENTER);
        }

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        markersRef.current.push(
          new MarkerCtor({
            map: mapInstanceRef.current,
            position: customerPoint,
            title: `(customer - ${order.customer_name || "Customer"})`,
            label: "C",
          }),
        );

        if (riderPoint) {
          markersRef.current.push(
            new MarkerCtor({
              map: mapInstanceRef.current,
              position: riderPoint,
              title: `(rider - ${order.rider_name || "Rider"})`,
              label: "R",
            }),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load map.");
        }
      }
    }

    renderMap();
    return () => {
      cancelled = true;
    };
  }, [
    order?.pickup_latitude,
    order?.pickup_longitude,
    order?.rider_last_latitude,
    order?.rider_last_longitude,
    order?.customer_name,
    order?.rider_name,
  ]);

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
      <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-[#4c84a4] flex items-center gap-2">
        <MapPin size={14} />
        Live location tracking
      </div>
      <div ref={mapRef} className="h-56 w-full" />
    </div>
  );
}

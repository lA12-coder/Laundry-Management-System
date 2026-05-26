import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Store,
  Map as MapIcon,
} from "lucide-react";
import { loadGoogleMaps, hasGoogleMapsKey } from "../../lib/googleMapsLoader";
import { RiderMapSkeleton } from "./RiderJobSkeleton";

const DEFAULT_CENTER = { lat: 9.03, lng: 38.74 };

/**
 * Geocode an address string; returns null on failure.
 */
async function geocodeAddress(maps, address) {
  if (!address?.trim()) return null;
  const geocoder = new maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Google Maps route engine — partner hub → customer (after privacy unlock).
 */
export default function LogisticsMap({
  job,
  riderCoords,
  className = "",
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const directionsRenderer = useRef(null);

  const [mapState, setMapState] = useState("loading");
  const [mapMessage, setMapMessage] = useState("");

  const accepted = Boolean(job?.is_assignment_accepted);
  const partnerHub = job?.partner_hub;
  const hubQuery =
    partnerHub?.hub_address || partnerHub?.business_name || null;
  const customerQuery = accepted ? job?.delivery_address : null;

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!hasGoogleMapsKey()) {
        setMapState("no_key");
        setMapMessage("Add VITE_GOOGLE_MAPS_API_KEY to enable live routing.");
        return;
      }

      if (!accepted) {
        setMapState("locked");
        setMapMessage(
          `Map routing unlocks after acceptance. Region: ${job?.delivery_region || "—"}`,
        );
        return;
      }

      if (!customerQuery) {
        setMapState("no_address");
        setMapMessage("Delivery coordinates are not available for this order.");
        return;
      }

      setMapState("loading");
      setMapMessage("");

      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          directionsRenderer.current = new maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: "#34d399",
              strokeWeight: 5,
              strokeOpacity: 0.9,
            },
          });
          directionsRenderer.current.setMap(mapInstance.current);
        }

        const hubLatLng = hubQuery
          ? await geocodeAddress(maps, hubQuery)
          : null;
        const customerLatLng = await geocodeAddress(maps, customerQuery);

        if (cancelled) return;

        if (!customerLatLng) {
          setMapState("geocode_fail");
          setMapMessage(
            "Could not resolve customer address. Use the text address for navigation.",
          );
          mapInstance.current.setCenter(DEFAULT_CENTER);
          return;
        }

        const origin = hubLatLng || riderCoords || DEFAULT_CENTER;
        const destination = customerLatLng;

        if (!hubLatLng && !riderCoords) {
          mapInstance.current.setCenter(customerLatLng);
          mapInstance.current.setZoom(14);
          new maps.Marker({
            map: mapInstance.current,
            position: customerLatLng,
            title: "Customer drop-off",
          });
          setMapState("ready");
          setMapMessage("Partner hub location missing — showing customer pin only.");
          return;
        }

        const directionsService = new maps.DirectionsService();
        directionsService.route(
          {
            origin,
            destination,
            travelMode: maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (cancelled) return;
            if (status === "OK" && result) {
              directionsRenderer.current.setDirections(result);
              setMapState("ready");
              setMapMessage("");
            } else {
              setMapState("route_fail");
              setMapMessage("Driving route unavailable. Showing marker fallback.");
              mapInstance.current.setCenter(customerLatLng);
              mapInstance.current.setZoom(14);
              if (hubLatLng) {
                new maps.Marker({
                  map: mapInstance.current,
                  position: hubLatLng,
                  title: partnerHub?.business_name || "Partner hub",
                  icon: {
                    path: maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4c84a4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#fff",
                  },
                });
              }
              new maps.Marker({
                map: mapInstance.current,
                position: customerLatLng,
                title: "Customer",
              });
            }
          },
        );
      } catch (err) {
        if (!cancelled) {
          setMapState("error");
          setMapMessage(err.message || "Map failed to initialize.");
        }
      }
    }

    initMap();
    return () => {
      cancelled = true;
    };
  }, [accepted, customerQuery, hubQuery, job?.id, riderCoords, job?.delivery_region]);

  if (mapState === "loading") {
    return (
      <div className={className}>
        <RiderMapSkeleton />
      </div>
    );
  }

  const showMapCanvas = ["ready", "route_fail", "geocode_fail"].includes(mapState);

  return (
    <div
      className={`rounded-2xl border border-white/10 overflow-hidden bg-slate-900/50 ${className}`}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <MapIcon size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">
            Route engine
          </span>
        </div>
        {accepted && partnerHub && (
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Store size={12} /> Hub
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> Drop-off
            </span>
          </div>
        )}
      </div>

      {mapState === "locked" && (
        <div className="p-6 flex flex-col items-center text-center gap-3 min-h-[220px] justify-center">
          <Navigation className="w-10 h-10 text-slate-500" />
          <p className="text-sm text-slate-400 max-w-xs">{mapMessage}</p>
        </div>
      )}

      {(mapState === "no_key" ||
        mapState === "no_address" ||
        mapState === "error") && (
        <div className="p-6 flex flex-col items-center text-center gap-3 min-h-[220px] justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="text-sm text-slate-300 max-w-xs">{mapMessage}</p>
        </div>
      )}

      {showMapCanvas && (
        <>
          <div ref={mapRef} className="w-full h-[280px] sm:h-[320px]" />
          {mapMessage && (
            <p className="px-4 py-2 text-xs text-amber-200/90 bg-amber-500/10 border-t border-amber-500/20">
              {mapMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}

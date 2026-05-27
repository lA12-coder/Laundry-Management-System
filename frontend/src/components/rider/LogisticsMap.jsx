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

async function getMapsConstructors(maps) {
  if (typeof maps.Map === "function") {
    return {
      MapCtor: maps.Map,
      MarkerCtor: maps.Marker,
      GeocoderCtor: maps.Geocoder,
      DirectionsServiceCtor: maps.DirectionsService,
      DirectionsRendererCtor: maps.DirectionsRenderer,
      SymbolPath: maps.SymbolPath,
      TravelMode: maps.TravelMode,
    };
  }

  if (typeof maps.importLibrary === "function") {
    const mapsLib = await maps.importLibrary("maps");
    const markerLib = await maps.importLibrary("marker").catch(() => ({}));
    const routesLib = await maps.importLibrary("routes").catch(() => ({}));
    const geocodingLib = await maps.importLibrary("geocoding").catch(() => ({}));

    return {
      MapCtor: mapsLib.Map,
      MarkerCtor: markerLib.Marker || maps.Marker || mapsLib.Marker || null,
      GeocoderCtor: geocodingLib.Geocoder || maps.Geocoder || mapsLib.Geocoder || null,
      DirectionsServiceCtor:
        routesLib.DirectionsService || maps.DirectionsService || mapsLib.DirectionsService || null,
      DirectionsRendererCtor:
        routesLib.DirectionsRenderer || maps.DirectionsRenderer || mapsLib.DirectionsRenderer || null,
      SymbolPath: maps.SymbolPath,
      TravelMode: maps.TravelMode,
    };
  }

  throw new Error("Google Maps constructors are unavailable. Check API key restrictions.");
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

        const constructors = await getMapsConstructors(maps);
        const {
          MapCtor,
          MarkerCtor,
          GeocoderCtor,
          DirectionsServiceCtor,
          DirectionsRendererCtor,
          SymbolPath,
          TravelMode,
        } = constructors;

        if (!MapCtor || !GeocoderCtor || !DirectionsServiceCtor || !DirectionsRendererCtor) {
          throw new Error("Google Maps libraries are incomplete. Enable Maps JavaScript and Directions APIs.");
        }

        if (!mapInstance.current) {
          mapInstance.current = new MapCtor(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          directionsRenderer.current = new DirectionsRendererCtor({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: "#34d399",
              strokeWeight: 5,
              strokeOpacity: 0.9,
            },
          });
          directionsRenderer.current.setMap(mapInstance.current);
        }

        // Rebind geocoder helper to whichever API flavor is available.
        const geocodeWithCtor = async (address) => {
          if (!address?.trim()) return null;
          const geocoder = new GeocoderCtor();
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
        };

        const hubLatLng = hubQuery
          ? await geocodeWithCtor(hubQuery)
          : null;
        const customerLatLng = await geocodeWithCtor(customerQuery);

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
          if (MarkerCtor) {
            new MarkerCtor({
              map: mapInstance.current,
              position: customerLatLng,
              title: "Customer drop-off",
            });
          }
          setMapState("ready");
          setMapMessage("Partner hub location missing — showing customer pin only.");
          return;
        }

        const directionsService = new DirectionsServiceCtor();
        directionsService.route(
          {
            origin,
            destination,
            travelMode: TravelMode?.DRIVING || "DRIVING",
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
              if (hubLatLng && MarkerCtor) {
                new MarkerCtor({
                  map: mapInstance.current,
                  position: hubLatLng,
                  title: partnerHub?.business_name || "Partner hub",
                  icon: {
                    path: SymbolPath?.CIRCLE,
                    scale: 8,
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#fff",
                  },
                });
              }
              if (MarkerCtor) {
                new MarkerCtor({
                  map: mapInstance.current,
                  position: customerLatLng,
                  title: "Customer",
                });
              }
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

  const showMapCanvas = ["loading", "ready", "route_fail", "geocode_fail"].includes(
    mapState,
  );

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <MapIcon size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">
            Route engine
          </span>
        </div>
        {accepted && partnerHub && (
          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
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
          <Navigation className="w-10 h-10 text-slate-500 dark:text-slate-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">{mapMessage}</p>
        </div>
      )}

      {(mapState === "no_key" ||
        mapState === "no_address" ||
        mapState === "error") && (
        <div className="p-6 flex flex-col items-center text-center gap-3 min-h-[220px] justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">{mapMessage}</p>
        </div>
      )}

      {showMapCanvas && (
        <>
          <div className="relative w-full h-[280px] sm:h-[320px]">
            <div
              ref={mapRef}
              className={`w-full h-full ${mapState === "loading" ? "opacity-0" : "opacity-100"}`}
            />
            {mapState === "loading" && (
              <div className="absolute inset-0">
                <RiderMapSkeleton />
              </div>
            )}
          </div>
          {mapMessage && (
            <p className="px-4 py-2 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-200 dark:border-amber-500/20">
              {mapMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}

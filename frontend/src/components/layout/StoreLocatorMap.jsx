import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MapPin } from "lucide-react";
import { hasGoogleMapsKey, loadGoogleMaps } from "../../lib/googleMapsLoader";
import {
  engagementQueryKeys,
  fetchPublicLaundryLocations,
} from "../../services/engagementApi";

const DEFAULT_CENTER = { lat: 8.514477, lng: 39.269257 };
async function resolveMapConstructors(maps) {
  if (typeof maps.Map === "function") {
    return {
      MapCtor: maps.Map,
      MarkerCtor: maps.Marker,
      InfoWindowCtor: maps.InfoWindow,
    };
  }
  if (typeof maps.importLibrary === "function") {
    const mapsLib = await maps.importLibrary("maps");
    const markerLib = await maps.importLibrary("marker").catch(() => ({}));
    return {
      MapCtor: mapsLib.Map,
      MarkerCtor: markerLib.Marker || maps.Marker || null,
      InfoWindowCtor: maps.InfoWindow || mapsLib.InfoWindow || null,
    };
  }
  throw new Error("Google Maps constructors are unavailable.");
}

export default function StoreLocatorMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState("");

  const { data: locations = [] } = useQuery({
    queryKey: engagementQueryKeys.publicLocations,
    queryFn: fetchPublicLaundryLocations,
    staleTime: 60_000,
  });

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!hasGoogleMapsKey()) {
        setMapError("Google Maps API key is missing.");
        return;
      }
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const { MapCtor, MarkerCtor, InfoWindowCtor } =
          await resolveMapConstructors(maps);
        if (!MapCtor || !MarkerCtor) {
          throw new Error("Google Maps marker library is unavailable.");
        }
        const points = (locations || [])
          .map((loc) => ({
            ...loc,
            lat: Number(loc.latitude),
            lng: Number(loc.longitude),
          }))
          .filter((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng));

        const center = points[0] || DEFAULT_CENTER;
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new MapCtor(mapRef.current, {
            center,
            zoom: points.length > 1 ? 7 : 13,
            mapTypeControl: false,
            streetViewControl: false,
          });
        } else {
          mapInstanceRef.current.setCenter(center);
        }

        markersRef.current.forEach((marker) => marker.setMap?.(null));
        markersRef.current = [];

        const infoWindow = InfoWindowCtor ? new InfoWindowCtor() : null;
        points.forEach((point) => {
          const marker = new MarkerCtor({
            map: mapInstanceRef.current,
            position: { lat: point.lat, lng: point.lng },
            title: point.hub_name,
            icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          });
          if (infoWindow && marker.addListener) {
            marker.addListener("click", () => {
              infoWindow.setContent(`<strong>${point.hub_name}</strong>`);
              infoWindow.open({
                anchor: marker,
                map: mapInstanceRef.current,
              });
            });
          }
          markersRef.current.push(marker);
        });
      } catch (error) {
        if (!cancelled) setMapError(error.message || "Map failed to load.");
      }
    }
    draw();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  if (mapError) {
    return (
      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-900 text-sm flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5" />
        <span>{mapError}</span>
      </div>
    );
  }

  return (
    <div className="rounded-[40px] overflow-hidden shadow-2xl h-[400px] md:h-[500px] border border-slate-200 bg-white">
      <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-[#4c84a4] flex items-center gap-2">
        <MapPin size={14} />
        FuaLaundry Hub Locator
      </div>
      <div ref={mapRef} className="h-[calc(100%-38px)] w-full" />
    </div>
  );
}

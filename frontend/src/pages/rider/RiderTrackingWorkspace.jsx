import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import RiderJobQueue from "../../components/rider/RiderJobQueue";
import LogisticsMap from "../../components/rider/LogisticsMap";
import ContactReveal from "../../components/rider/ContactReveal";
import {
  getRiderPosition,
  geolocationErrorMessage,
  watchRiderPosition,
} from "../../lib/geolocation";
import { updateRiderJobLocation } from "../../services/riderApi";

export default function RiderTrackingWorkspace() {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const lastSyncedAtRef = useRef(0);

  const loadGeo = useCallback(() => {
    setGeoError(null);
    getRiderPosition()
      .then(setCoords)
      .catch((err) => {
        setCoords(null);
        setGeoError(geolocationErrorMessage(err));
      });
  }, []);

  useEffect(() => {
    loadGeo();
  }, [loadGeo]);

  useEffect(() => {
    const stopWatcher = watchRiderPosition(
      (position) => {
        setGeoError(null);
        setCoords(position);
      },
      (err) => {
        setGeoError(geolocationErrorMessage(err));
      },
    );
    return stopWatcher;
  }, []);

  const locationMutation = useMutation({
    mutationFn: ({ orderId, lat, lng }) => updateRiderJobLocation(orderId, { lat, lng }),
    onSuccess: (updated) => {
      if (updated?.id === selectedJob?.id) {
        setSelectedJob(updated);
      }
    },
  });

  useEffect(() => {
    if (!selectedJob?.id || !coords?.lat || !coords?.lng) return;
    const now = Date.now();
    if (now - lastSyncedAtRef.current < 8000) return;
    lastSyncedAtRef.current = now;
    locationMutation.mutate({
      orderId: selectedJob.id,
      lat: coords.lat,
      lng: coords.lng,
    });
  }, [selectedJob?.id, coords?.lat, coords?.lng]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiderJobQueue
          coords={coords}
          geoError={geoError}
          onRetryGeo={loadGeo}
          selectedJobId={selectedJob?.id}
          onSelectJob={setSelectedJob}
        />

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {selectedJob ? (
            <>
              <LogisticsMap job={selectedJob} riderCoords={coords} />
              <ContactReveal job={selectedJob} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-10 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-zinc-900">
              Select a job to preview the route engine and contact panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

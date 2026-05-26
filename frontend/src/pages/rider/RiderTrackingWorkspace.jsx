import { useCallback, useEffect, useState } from "react";
import RiderJobQueue from "../../components/rider/RiderJobQueue";
import LogisticsMap from "../../components/rider/LogisticsMap";
import ContactReveal from "../../components/rider/ContactReveal";
import {
  getRiderPosition,
  geolocationErrorMessage,
} from "../../lib/geolocation";

export default function RiderTrackingWorkspace() {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

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
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-500 text-sm">
              Select a job to preview the route engine and contact panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  Radar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { formatOrderStatus } from "../../constants/orderStatus";
import {
  acceptRiderJob,
  confirmRiderPickup,
  fetchRiderJobs,
  markRiderDelivered,
  riderQueryKeys,
} from "../../services/riderApi";
import { RiderJobQueueSkeleton } from "./RiderJobSkeleton";

function JobCard({
  job,
  selected,
  onSelect,
  onAccept,
  onConfirmPickup,
  onMarkDelivered,
  isAccepting,
  isPickupPending,
  isDeliveredPending,
}) {
  const accepted = job.is_assignment_accepted;
  const isPickedUp = [
    "washing",
    "washed",
    "dried",
    "ready",
    "out_for_delivery",
    "delivered",
  ].includes(job.status);
  const isDeliveredByRider = Boolean(job.rider_delivered_confirmed_at) || job.status === "delivered";
  const distance =
    job.approximate_distance_km != null
      ? `~${job.approximate_distance_km} km`
      : "Distance after GPS";

  return (
    <li
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-3 transition-all cursor-pointer",
        selected
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
      )}
      onClick={() => onSelect(job)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(job)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100">#{job.id}</span>
          {job.urgency === "urgent" && (
            <span className="text-[9px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-1.5 py-0.5 rounded">
              Urgent
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
          {formatOrderStatus(job.status)}
        </span>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
        {job.customer_name || "Customer"}
      </p>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <MapPin size={14} className="text-emerald-400/80" />
        <span>
          {accepted ? job.delivery_address : job.delivery_region}
        </span>
      </div>

      {!accepted && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
          <Navigation size={14} />
          {distance} to region
          {job.partner_name && (
            <span className="text-slate-600">· via {job.partner_name}</span>
          )}
        </div>
      )}

      {job.can_accept && !accepted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept(job);
          }}
          disabled={isAccepting}
          className="w-full py-2.5 rounded-xl bg-[#4c84a4] hover:bg-[#3a6680] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isAccepting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Accept assignment
        </button>
      )}

      {accepted && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} />
            Assignment locked — contact unlocked
          </p>
          <div className="flex flex-wrap gap-2">
            {!isPickedUp ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmPickup(job);
                }}
                disabled={isPickupPending}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-60"
              >
                {isPickupPending ? "Updating..." : "Confirm Picked Up"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-default"
              >
                Picked Up
              </button>
            )}

            {isPickedUp && !isDeliveredByRider ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDelivered(job);
                }}
                disabled={isDeliveredPending}
                className="px-3 py-1.5 rounded-lg bg-[#4c84a4] hover:bg-[#3a6680] text-white text-[11px] font-bold disabled:opacity-60"
              >
                {isDeliveredPending ? "Updating..." : "Mark as Delivered"}
              </button>
            ) : null}

            {isDeliveredByRider ? (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-bold cursor-default"
              >
                Delivered
              </button>
            ) : null}
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Incoming work vectors with privacy masking before acceptance.
 */
export default function RiderJobQueue({
  coords,
  geoError,
  onRetryGeo,
  selectedJobId,
  onSelectJob,
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: riderQueryKeys.jobs(coords),
    queryFn: () => fetchRiderJobs(coords),
    refetchInterval: 20_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (jobId) => acceptRiderJob(jobId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: riderQueryKeys.jobs(coords) });
      onSelectJob?.(updated);
    },
  });

  const pickupMutation = useMutation({
    mutationFn: ({ jobId, coordsPayload }) => confirmRiderPickup(jobId, coordsPayload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: riderQueryKeys.jobs(coords) });
      onSelectJob?.(updated);
    },
  });

  const deliveredMutation = useMutation({
    mutationFn: ({ jobId, coordsPayload }) => markRiderDelivered(jobId, coordsPayload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: riderQueryKeys.jobs(coords) });
      onSelectJob?.(updated);
    },
  });

  const incoming = data?.incoming ?? [];
  const active = data?.active ?? [];
  const allJobs = [...incoming, ...active];

  const handleAccept = (job) => {
    if (
      !window.confirm(
        `Accept order #${job.id}? You will unlock customer contact and full routing.`,
      )
    ) {
      return;
    }
    acceptMutation.mutate(job.id);
  };

  const handleConfirmPickup = (job) => {
    pickupMutation.mutate({
      jobId: job.id,
      coordsPayload: coords || {},
    });
  };

  const handleMarkDelivered = (job) => {
    deliveredMutation.mutate({
      jobId: job.id,
      coordsPayload: coords || {},
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Delivery queue</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Region distances only until you accept — then full GIS routing unlocks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          <Radar size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {geoError && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>{geoError}</span>
          {onRetryGeo && (
            <button
              type="button"
              onClick={onRetryGeo}
              className="text-xs font-bold underline"
            >
              Retry location
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <RiderJobQueueSkeleton count={4} />
      ) : isError ? (
        <p className="text-red-400 text-sm">Failed to load jobs. Check connection.</p>
      ) : allJobs.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-500 text-sm italic py-8 text-center">
          No deliveries in your queue right now.
        </p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                Incoming ({incoming.length})
              </h2>
              <ul className="space-y-3">
                {incoming.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedJobId === job.id}
                    onSelect={onSelectJob}
                    onAccept={handleAccept}
                    onConfirmPickup={handleConfirmPickup}
                    onMarkDelivered={handleMarkDelivered}
                    isAccepting={
                      acceptMutation.isPending &&
                      acceptMutation.variables === job.id
                    }
                    isPickupPending={
                      pickupMutation.isPending &&
                      pickupMutation.variables?.jobId === job.id
                    }
                    isDeliveredPending={
                      deliveredMutation.isPending &&
                      deliveredMutation.variables?.jobId === job.id
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                Active ({active.length})
              </h2>
              <ul className="space-y-3">
                {active.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedJobId === job.id}
                    onSelect={onSelectJob}
                    onAccept={handleAccept}
                    onConfirmPickup={handleConfirmPickup}
                    onMarkDelivered={handleMarkDelivered}
                    isAccepting={false}
                    isPickupPending={
                      pickupMutation.isPending &&
                      pickupMutation.variables?.jobId === job.id
                    }
                    isDeliveredPending={
                      deliveredMutation.isPending &&
                      deliveredMutation.variables?.jobId === job.id
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

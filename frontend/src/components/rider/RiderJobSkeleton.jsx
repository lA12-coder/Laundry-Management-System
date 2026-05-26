import { SkeletonCard } from "../admin/orders/SkeletonCard";

/** Queue card skeleton — matches RiderJobQueue card height (~132px). */
export function RiderJobCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 animate-pulse min-h-[132px]"
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="h-5 bg-white/10 rounded-full w-16" />
      </div>
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="h-9 bg-white/10 rounded-xl w-full mt-2" />
    </div>
  );
}

export function RiderJobQueueSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <RiderJobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RiderMapSkeleton() {
  return <SkeletonCard lines={5} className="min-h-[280px] bg-slate-900/40 border-white/10" />;
}

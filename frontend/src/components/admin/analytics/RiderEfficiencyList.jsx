import { Bike, CheckCircle2, Clock } from "lucide-react";
import { cn } from "../../../lib/utils";
import { SkeletonCard } from "../orders/SkeletonCard";

function LoadBar({ load, maxLoad }) {
  const pct = maxLoad > 0 ? Math.min(100, (load / maxLoad) * 100) : 0;
  const tone =
    pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-[#4c84a4]";

  return (
    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function RiderEfficiencyList({ riders = [], isLoading }) {
  if (isLoading) {
    return (
      <SkeletonCard
        lines={6}
        className="min-h-[320px] dark:border-gray-800 dark:bg-gray-900"
      />
    );
  }

  const maxLoad = Math.max(...riders.map((r) => r.current_load ?? 0), 1);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50">
          <Bike size={20} className="text-[#4c84a4] dark:text-sky-300" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
            Operator efficiency leaderboard
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Load factor vs completed deliveries in range
          </p>
        </div>
      </div>

      {riders.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
          No active riders found.
        </p>
      ) : (
        <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {riders.map((rider, index) => (
            <li
              key={rider.id}
              className="rounded-xl border border-gray-50 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-800/40"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    <span className="text-gray-400 dark:text-gray-500 mr-1.5">
                      #{index + 1}
                    </span>
                    {rider.full_name || rider.email}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    Load {rider.current_load ?? 0} · {rider.efficiency_pct ?? 0}% efficiency
                  </p>
                </div>
              </div>
              <LoadBar load={rider.current_load ?? 0} maxLoad={maxLoad} />
              <div className="flex gap-4 mt-2 text-[10px] font-semibold">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  {rider.completed ?? 0} done
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock size={12} />
                  {rider.pending ?? 0} pending
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Loader2, UserCheck } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  fetchOrderFormOptions,
  reassignOrderRider,
  orderQueryKeys,
} from "../../../services/ordersApi";
import { SkeletonCard } from "./SkeletonCard";

/**
 * Manual rider override — uses form-options workload (current_load).
 */
export default function RiderAssignmentPanel({
  order,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();
  const [selectedRider, setSelectedRider] = useState(
    order.rider ? String(order.rider) : "",
  );

  const { data: formOptions, isLoading } = useQuery({
    queryKey: orderQueryKeys.formOptions,
    queryFn: fetchOrderFormOptions,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (riderId) => reassignOrderRider(order.id, Number(riderId)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      onSuccess?.(updated);
    },
    onError: (err) => {
      onError?.(err?.response?.data?.message || "Rider reassignment failed.");
    },
  });

  const riders = formOptions?.riders ?? [];
  const maxLoad = Math.max(...riders.map((r) => r.current_load ?? 0), 1);

  const handleAssign = () => {
    if (!selectedRider) return;
    if (Number(selectedRider) === order.rider) return;
    const rider = riders.find((r) => r.id === Number(selectedRider));
    const label = rider?.full_name || rider?.email || "this rider";
    const loadNote = rider ? ` (current load: ${rider.current_load ?? 0})` : "";
    if (
      !window.confirm(
        `Assign order #${order.id} to ${label}${loadNote}? This override is audit-logged.`,
      )
    ) {
      return;
    }
    mutation.mutate(selectedRider);
  };

  if (isLoading) return <SkeletonCard lines={4} />;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Bike size={18} className="text-[#4c84a4] dark:text-sky-300" />
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Rider assignment
        </h3>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Current:{" "}
        <span className="font-bold text-gray-800 dark:text-gray-200">
          {order.rider_name || "Unassigned"}
        </span>
      </p>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Select rider (by capacity)
        </label>
        <select
          value={selectedRider}
          onChange={(e) => setSelectedRider(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none"
        >
          <option value="">— Choose rider —</option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.full_name || rider.email} · load {rider.current_load ?? 0}
            </option>
          ))}
        </select>
      </div>

      {selectedRider && (
        <ul className="space-y-1.5 max-h-36 overflow-y-auto">
          {riders.map((rider) => {
            const load = rider.current_load ?? 0;
            const pct = Math.min(100, Math.round((load / maxLoad) * 100));
            const isSelected = String(rider.id) === selectedRider;
            return (
              <li
                key={rider.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs border",
                  isSelected
                    ? "border-[#4c84a4]/40 bg-blue-50/80 dark:bg-sky-950/40"
                    : "border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50",
                )}
              >
                <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  <span>{rider.full_name || rider.email}</span>
                  <span className="text-[#4c84a4] dark:text-sky-300">{load} active</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4c84a4] dark:bg-sky-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={handleAssign}
        disabled={!selectedRider || mutation.isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserCheck size={16} />
        )}
        Apply override
      </button>
    </div>
  );
}

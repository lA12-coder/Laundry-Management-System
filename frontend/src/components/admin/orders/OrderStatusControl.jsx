import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  OrderStatus,
  ORDER_STATUS_VALUES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  ORDER_STATUS_REQUIRES_CONFIRMATION,
  formatOrderStatus,
} from "../../../constants/orderStatus";
import { overrideOrderStatus, orderQueryKeys } from "../../../services/ordersApi";

function buildConfirmMessage(currentStatus, nextStatus) {
  if (nextStatus === OrderStatus.DELIVERED) {
    return (
      "Mark this order as DELIVERED? The server will stamp delivered_at using Django timezone.now()."
    );
  }
  if (nextStatus === OrderStatus.CANCELLED) {
    return "Cancel this order? This action is logged and may affect partner payouts.";
  }
  return `Change status from ${formatOrderStatus(currentStatus)} to ${formatOrderStatus(nextStatus)}?`;
}

/**
 * Lifecycle override panel — posts to /admin/orders/{id}/override-status/
 */
export default function OrderStatusControl({
  order,
  onSuccess,
  onError,
  compact = false,
}) {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (status) => overrideOrderStatus(order.id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      setConfirmOpen(false);
      setPendingStatus(null);
      onSuccess?.(updated);
    },
    onError: (err) => {
      onError?.(err?.response?.data?.message || "Status override failed.");
    },
  });

  const requestStatusChange = (nextStatus) => {
    if (nextStatus === order.status) return;
    if (ORDER_STATUS_REQUIRES_CONFIRMATION.includes(nextStatus)) {
      setPendingStatus(nextStatus);
      setConfirmOpen(true);
      return;
    }
    mutation.mutate(nextStatus);
  };

  const confirmChange = () => {
    if (pendingStatus) mutation.mutate(pendingStatus);
  };

  const available = ORDER_STATUS_VALUES.filter((s) => s !== order.status);

  if (compact) {
    return (
      <select
        value={order.status}
        disabled={mutation.isPending}
        onChange={(e) => requestStatusChange(e.target.value)}
        className="text-xs font-bold border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none"
      >
        {ORDER_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="text-[#4c84a4] dark:text-sky-300" />
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Lifecycle control
        </h3>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Current</span>
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            ORDER_STATUS_STYLES[order.status],
          )}
        >
          {formatOrderStatus(order.status)}
        </span>
        {order.delivered_at && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            delivered {new Date(order.delivered_at).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {available.map((status) => {
          const needsConfirm = ORDER_STATUS_REQUIRES_CONFIRMATION.includes(status);
          return (
            <button
              key={status}
              type="button"
              disabled={mutation.isPending}
              onClick={() => requestStatusChange(status)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                needsConfirm
                  ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                  : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#4c84a4]/30 hover:bg-blue-50/50 dark:hover:bg-sky-950/40",
                mutation.isPending && "opacity-50 cursor-not-allowed",
              )}
            >
              → {ORDER_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>

      {confirmOpen && pendingStatus && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3">
          <div className="flex gap-2">
            <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium leading-snug">
              {buildConfirmMessage(order.status, pendingStatus)}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setPendingStatus(null);
              }}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmChange}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Confirm override
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

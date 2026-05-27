import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, UserCheck } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";
import {
  assignOrderPartner,
  fetchOrderFormOptions,
  orderQueryKeys,
} from "../../../services/ordersApi";

export default function PartnerAssignmentPanel({ order, onSuccess, onError }) {
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState(
    order.partner ? String(order.partner) : "",
  );

  useEffect(() => {
    setSelectedPartner(order.partner ? String(order.partner) : "");
  }, [order.partner, order.id]);

  const { data: formOptions, isLoading } = useQuery({
    queryKey: orderQueryKeys.formOptions,
    queryFn: fetchOrderFormOptions,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (partnerId) => assignOrderPartner(order.id, Number(partnerId)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      onSuccess?.(updated);
    },
    onError: (err) => {
      onError?.(err?.response?.data?.detail || "Partner assignment failed.");
    },
  });

  if (isLoading) return <SkeletonCard lines={4} />;

  const partners = formOptions?.partners ?? [];

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-[#4c84a4] dark:text-sky-300" />
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Partner assignment
        </h3>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Current:{" "}
        <span className="font-bold text-gray-800 dark:text-gray-200">
          {order.partner_name || "Unassigned"}
        </span>
      </p>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Select existing partner
        </label>
        <select
          value={selectedPartner}
          onChange={(e) => setSelectedPartner(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none"
        >
          <option value="">— Choose partner —</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.business_name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!selectedPartner || Number(selectedPartner) === order.partner) return;
          mutation.mutate(selectedPartner);
        }}
        disabled={
          !selectedPartner ||
          mutation.isPending ||
          Number(selectedPartner) === order.partner
        }
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserCheck size={16} />
        )}
        Assign partner
      </button>
    </div>
  );
}

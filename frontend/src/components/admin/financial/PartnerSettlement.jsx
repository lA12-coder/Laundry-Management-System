import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, HandCoins, Loader2 } from "lucide-react";
import { useToast } from "../ToastContainer";
import {
  clearPartnerSettlement,
  fetchPartnerSettlementLedger,
  fetchPartnerSettlementSnapshot,
  fetchSettlementPartners,
  orderQueryKeys,
} from "../../../services/ordersApi";
import { formatMoneyETB } from "../../../lib/money";
import SettlementLedgerTable from "../../financial/SettlementLedgerTable";

export default function PartnerSettlement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [partnerId, setPartnerId] = useState("");

  const { data: partners = [] } = useQuery({
    queryKey: orderQueryKeys.settlementPartners,
    queryFn: fetchSettlementPartners,
    staleTime: 60_000,
  });

  const { data: snapshot, isFetching: snapshotLoading } = useQuery({
    queryKey: orderQueryKeys.settlementSnapshot(partnerId),
    queryFn: () => fetchPartnerSettlementSnapshot(partnerId),
    enabled: Boolean(partnerId),
  });

  const { data: ledger } = useQuery({
    queryKey: orderQueryKeys.settlementLedger(partnerId || "all"),
    queryFn: () => fetchPartnerSettlementLedger(partnerId || undefined),
    enabled: Boolean(partnerId),
  });

  const settleMutation = useMutation({
    mutationFn: () => clearPartnerSettlement(partnerId),
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.settlementPartners });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.settlementSnapshot(partnerId),
      });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.settlementLedger(partnerId || "all"),
      });
      toast.success(
        "Settlement completed",
        `${payload.updated_count || 0} order(s) marked PAID.`,
      );
    },
    onError: (err) => {
      toast.error(
        "Settlement failed",
        err?.response?.data?.detail || "Could not clear partner debt.",
      );
    },
  });

  const unpaidRows = snapshot?.unpaid_orders || [];
  const totalDue = snapshot?.total_due || 0;
  const selectedPartnerName = useMemo(() => {
    return partners.find((p) => String(p.id) === String(partnerId))?.business_name;
  }, [partners, partnerId]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HandCoins size={18} className="text-[#4c84a4] dark:text-sky-300" />
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Partner settlement
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Select partner
            </label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200"
            >
              <option value="">— Choose partner —</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.business_name} · debt {formatMoneyETB(partner.outstanding_debt || 0)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Outstanding debt
            </p>
            <p className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">
              {formatMoneyETB(totalDue)}
            </p>
          </div>
        </div>

        {partnerId && (
          <>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-3 py-2">Order</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Net earning</th>
                    <th className="text-left px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshotLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        Loading unpaid orders...
                      </td>
                    </tr>
                  ) : unpaidRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        No unpaid orders for this partner.
                      </td>
                    </tr>
                  ) : (
                    unpaidRows.map((row) => (
                      <tr key={row.id} className="border-t border-gray-50 dark:border-gray-800">
                        <td className="px-3 py-2 font-mono">#{row.order_id}</td>
                        <td className="px-3 py-2">{row.order_status}</td>
                        <td className="px-3 py-2 font-semibold">
                          {formatMoneyETB(row.partner_earning)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={!partnerId || Number(totalDue) <= 0 || settleMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Confirm settlement for ${selectedPartnerName || "partner"}? Total: ${formatMoneyETB(totalDue)}`,
                  )
                ) {
                  settleMutation.mutate();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
            >
              {settleMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Clear settlement
            </button>
          </>
        )}
      </section>

      {partnerId && (
        <SettlementLedgerTable
          title="Settlement history"
          rows={ledger?.results || []}
          summary={ledger?.summary}
        />
      )}
    </div>
  );
}

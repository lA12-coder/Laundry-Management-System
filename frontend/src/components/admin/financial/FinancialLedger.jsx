import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, WalletCards } from "lucide-react";
import { fetchTransactionLogsPage, financialQueryKeys } from "../../../services/financialApi";
import { OrderTableSkeleton } from "../orders/SkeletonCard";

const moneyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export default function FinancialLedger({ filterParams = {} }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filterParams]);

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      ordering: "-created_at",
      ...filterParams,
    }),
    [pagination, filterParams],
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: financialQueryKeys.transactions(queryParams),
    queryFn: () => fetchTransactionLogsPage(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const rows = data?.results || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  const canPrev = pagination.pageIndex > 0;
  const canNext = pagination.pageIndex + 1 < pageCount;

  return (
    <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-slate-900 text-slate-100">
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <WalletCards size={16} className="text-cyan-300" />
          Financial Split Ledger
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Gross customer payment and revenue split flow across platform, rider, and partner.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-slate-100 dark:bg-zinc-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Transaction ID</th>
              <th className="text-left px-4 py-3">Linked Order ID</th>
              <th className="text-left px-4 py-3">Gross Customer Payment</th>
              <th className="text-left px-4 py-3">Fua Laundry Commission (15%)</th>
              <th className="text-left px-4 py-3">Rider Delivery Payout</th>
              <th className="text-left px-4 py-3">Partner Net Earning</th>
              <th className="text-left px-4 py-3">Date Settled</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <OrderTableSkeleton rows={8} columns={7} />
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
                  {error?.message || "Failed to load transaction ledger."}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No transaction rows found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-100 dark:border-zinc-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  <td className="px-4 py-3 font-mono">#{row.id}</td>
                  <td className="px-4 py-3 font-mono">#{row.order_id}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(row.base_value)}</td>
                  <td className="px-4 py-3 text-[#4c84a4] dark:text-sky-300 font-semibold">
                    {formatMoney(row.fualaundry_commission)}
                  </td>
                  <td className="px-4 py-3 text-amber-700 dark:text-amber-300 font-semibold">
                    {formatMoney(row.rider_fee)}
                  </td>
                  <td className="px-4 py-3 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {formatMoney(row.partner_earning)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {totalCount.toLocaleString()} transactions
          {isFetching && !isLoading ? (
            <span className="ml-2 text-[#4c84a4]">Refreshing…</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() =>
              setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))
            }
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[110px] text-center">
            Page {pagination.pageIndex + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() =>
              setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
            }
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

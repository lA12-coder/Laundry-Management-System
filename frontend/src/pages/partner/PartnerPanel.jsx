import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, Coins, Loader2, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchPartnerAnalytics,
  fetchPartnerLedger,
  fetchPartnerOrders,
  orderQueryKeys,
  updatePartnerOrderStatus,
} from "../../services/ordersApi";
import { formatMoneyETB } from "../../lib/money";
import { OrderStatus } from "../../constants/orderStatus";
import SettlementLedgerTable from "../../components/financial/SettlementLedgerTable";

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <Icon className="text-[#4c84a4] dark:text-sky-300 mb-3" size={18} />
      <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
        {label}
      </h2>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
    </article>
  );
}

function NextStatusButton({ order, onUpdate, isPending }) {
  const nextStatus = useMemo(() => {
    if (order.status === OrderStatus.WASHING) return OrderStatus.WASHED;
    if (order.status === OrderStatus.WASHED) return OrderStatus.DRIED;
    if (order.status === OrderStatus.DRIED) return null;
    return OrderStatus.WASHING;
  }, [order.status]);

  if (!nextStatus) {
    return (
      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
        Completed partner lane
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => onUpdate(order.id, nextStatus)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4c84a4] hover:bg-[#3a6680] text-white disabled:opacity-60"
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
      Move to {String(nextStatus).replace("_", " ").toUpperCase()}
    </button>
  );
}

export default function PartnerPanel() {
  const queryClient = useQueryClient();
  const { data: analytics } = useQuery({
    queryKey: orderQueryKeys.partnerAnalytics,
    queryFn: fetchPartnerAnalytics,
    refetchInterval: 30_000,
  });
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: orderQueryKeys.partnerOrders({}),
    queryFn: () => fetchPartnerOrders({}),
    refetchInterval: 30_000,
  });
  const { data: ledger } = useQuery({
    queryKey: orderQueryKeys.partnerLedger,
    queryFn: fetchPartnerLedger,
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => updatePartnerOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.partnerOrders({}) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.partnerAnalytics });
      toast.success("Order status updated");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.status?.[0] || "Could not update status");
    },
  });

  const orders = ordersData?.results || [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="text-[#4c84a4] dark:text-sky-300" size={24} />
          Partner operations workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage assigned orders and track your settlement balances.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={Coins}
          label="Current week revenue"
          value={formatMoneyETB(analytics?.week_revenue || 0)}
          hint="Net partner share in this week"
        />
        <MetricCard
          icon={CalendarDays}
          label="Current month revenue"
          value={formatMoneyETB(analytics?.month_revenue || 0)}
          hint="Net partner share in this month"
        />
        <MetricCard
          icon={Wallet}
          label="Paid balance"
          value={formatMoneyETB(analytics?.paid_balance || 0)}
          hint="Already settled by FuaLaundry"
        />
        <MetricCard
          icon={Wallet}
          label="Outstanding debt"
          value={formatMoneyETB(analytics?.outstanding_debt || 0)}
          hint="Awaiting settlement"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Assigned orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    No orders assigned to this partner yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-3 font-mono">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{order.customer_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 font-semibold uppercase">
                        {String(order.status).replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoneyETB(order.total_amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <NextStatusButton
                        order={order}
                        isPending={statusMutation.isPending}
                        onUpdate={(orderId, status) =>
                          statusMutation.mutate({ orderId, status })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SettlementLedgerTable
        title="Paid vs unpaid settlement ledger"
        rows={ledger?.results || []}
        summary={ledger?.summary}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Filter, RefreshCw, Search } from "lucide-react";
import { useToast } from "../../components/admin/ToastContainer";
import OrderTable from "../../components/admin/orders/OrderTable";
import OrderStatusControl from "../../components/admin/orders/OrderStatusControl";
import RiderAssignmentPanel from "../../components/admin/orders/RiderAssignmentPanel";
import { SkeletonCard } from "../../components/admin/orders/SkeletonCard";
import {
  OrderStatus,
  OrderUrgency,
  ORDER_STATUS_LABELS,
} from "../../constants/orderStatus";
import {
  fetchOrderFormOptions,
  orderQueryKeys,
} from "../../services/ordersApi";

const DEFAULT_FILTERS = {
  status: "",
  urgency: "",
  partner: "",
  date_from: "",
  date_to: "",
  search: "",
};

export default function OrderManagementWorkspace() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [draftFilters, setDraftFilters] = useState(() => ({
    status: searchParams.get("status") || "",
    urgency: searchParams.get("urgency") || "",
    partner: searchParams.get("partner") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
    search: searchParams.get("search") || "",
  }));

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  const { data: formOptions } = useQuery({
    queryKey: orderQueryKeys.formOptions,
    queryFn: fetchOrderFormOptions,
    staleTime: 120_000,
  });

  const apiFilters = useMemo(() => {
    const params = {};
    if (appliedFilters.status) params.status = appliedFilters.status;
    if (appliedFilters.urgency) params.urgency = appliedFilters.urgency;
    if (appliedFilters.partner) params.partner = appliedFilters.partner;
    if (appliedFilters.date_from) params.date_from = appliedFilters.date_from;
    if (appliedFilters.date_to) params.date_to = appliedFilters.date_to;
    if (appliedFilters.search?.trim()) params.search = appliedFilters.search.trim();
    return params;
  }, [appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    const next = new URLSearchParams();
    Object.entries(draftFilters).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    setSearchParams(next);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  const handleOrderUpdated = (updated) => {
    setSelectedOrder(updated);
    toast.success("Order updated", `Order #${updated.id} saved.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Server-side ledger with lifecycle overrides, ghost customer support, and
            rider capacity routing.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <Filter size={16} className="text-[#4c84a4]" />
          <span className="text-xs font-black uppercase tracking-wider">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="search"
              placeholder="Phone, name, address, order #"
              value={draftFilters.search}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none"
            />
          </div>
          <select
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, status: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl font-semibold text-gray-700 dark:text-gray-200"
          >
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={draftFilters.urgency}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, urgency: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl font-semibold text-gray-700 dark:text-gray-200"
          >
            <option value="">All urgency</option>
            <option value={OrderUrgency.REGULAR}>Regular</option>
            <option value={OrderUrgency.URGENT}>Urgent</option>
          </select>
          <select
            value={draftFilters.partner}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, partner: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl font-semibold text-gray-700 dark:text-gray-200"
          >
            <option value="">All partners</option>
            {(formOptions?.partners ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.business_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draftFilters.date_from}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, date_from: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl"
            title="From date"
          />
          <input
            type="date"
            value={draftFilters.date_to}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, date_to: e.target.value }))
            }
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl"
            title="To date"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold shadow-sm"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 min-w-0">
          <OrderTable
            filters={apiFilters}
            selectedOrderId={selectedOrder?.id}
            onSelectOrder={setSelectedOrder}
          />
        </div>

        <div className="space-y-4">
          {selectedOrder ? (
            <>
              <div className="rounded-2xl border border-[#4c84a4]/20 dark:border-sky-700/40 bg-blue-50/40 dark:bg-sky-950/20 p-4">
                <p className="text-xs font-bold text-[#4c84a4] uppercase tracking-wider">
                  Selected order
                </p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100 mt-1">
                  #{selectedOrder.id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {selectedOrder.customer_name}
                  {selectedOrder.is_ghost_customer && " (Ghost)"}
                </p>
                <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                  {selectedOrder.customer_phone}
                </p>
              </div>
              <OrderStatusControl
                order={selectedOrder}
                onSuccess={handleOrderUpdated}
                onError={(msg) => toast.error("Status failed", msg)}
              />
              <RiderAssignmentPanel
                order={selectedOrder}
                onSuccess={handleOrderUpdated}
                onError={(msg) => toast.error("Reassign failed", msg)}
              />
            </>
          ) : (
            <>
              <SkeletonCard lines={2} />
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                <RefreshCw size={20} className="mx-auto mb-2 opacity-40" />
                Select an order row to open lifecycle and rider override panels.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

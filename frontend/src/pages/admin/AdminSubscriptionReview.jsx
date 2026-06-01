import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Search, XCircle } from "lucide-react";
import { useToast } from "../../components/admin/ToastContainer";
import {
  approveSubscription,
  disableSubscription,
  fetchAdminSubscriptionQueue,
  rejectSubscription,
  subscriptionQueryKeys,
} from "../../services/subscriptionApi";

const STATUS_STYLES = {
  pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
  disabled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminSubscriptionReview() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_approval");

  const params = useMemo(() => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [search, statusFilter]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: subscriptionQueryKeys.adminQueue(params),
    queryFn: () => fetchAdminSubscriptionQueue(params),
  });

  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "admin"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, note }) => approveSubscription(id, note),
    onSuccess: () => {
      toast.success("Subscription approved.");
      refreshQueue();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => rejectSubscription(id, note),
    onSuccess: () => {
      toast.success("Subscription rejected.");
      refreshQueue();
    },
  });

  const disableMutation = useMutation({
    mutationFn: ({ id, note }) => disableSubscription(id, note),
    onSuccess: () => {
      toast.success("Subscription disabled.");
      refreshQueue();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
          Subscription approval queue
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Audit submitted receipts, activate subscriptions, or manually disable access.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or plan..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
        >
          <option value="">All statuses</option>
          <option value="pending_approval">Pending approval</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Dates</th>
                <th className="px-4 py-3 text-left font-semibold">Receipt</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    No subscriptions in this queue.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.customer_name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500">{row.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {row.plan_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${STATUS_STYLES[row.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                      >
                        {row.status?.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>Start: {row.start_date || "—"}</p>
                      <p>End: {row.end_date || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {row.receipt_url ? (
                        <a
                          href={row.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4c84a4] hover:underline text-xs font-semibold"
                        >
                          View receipt
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {row.status === "pending_approval" && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveMutation.mutate({ id: row.id, note: "" })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              <CheckCircle2 size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectMutation.mutate({ id: row.id, note: "Receipt rejected by admin." })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </>
                        )}
                        {row.status === "active" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Disable this active subscription now?")) {
                                disableMutation.mutate({
                                  id: row.id,
                                  note: "Disabled from admin workspace.",
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold"
                          >
                            <Ban size={14} />
                            Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

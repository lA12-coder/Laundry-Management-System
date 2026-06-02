import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  PencilLine,
  PlusCircle,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useToast } from "../../components/admin/ToastContainer";
import {
  approveSubscription,
  createAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  disableSubscription,
  fetchAdminSubscriptionPlans,
  fetchAdminSubscriptionQueue,
  rejectSubscription,
  subscriptionQueryKeys,
  updateAdminSubscriptionPlan,
} from "../../services/subscriptionApi";

const STATUS_STYLES = {
  pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
  disabled: "bg-red-100 text-red-700 border-red-200",
};

const CYCLE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const EMPTY_PLAN_FORM = {
  name: "",
  slug: "",
  billing_cycle: "monthly",
  price: "",
  duration_days: "",
  description: "",
  features: "",
  sort_order: "0",
  is_active: true,
};

export default function AdminSubscriptionReview() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planSearch, setPlanSearch] = useState("");

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

  const { data: adminPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: subscriptionQueryKeys.adminPlans({ search: planSearch }),
    queryFn: () => fetchAdminSubscriptionPlans({ search: planSearch }),
  });

  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "admin"] });
  };

  const refreshPlans = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "admin-plans"] });
    queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.plans });
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

  const createPlanMutation = useMutation({
    mutationFn: createAdminSubscriptionPlan,
    onSuccess: () => {
      toast.success("Subscription plan created.");
      setPlanForm(EMPTY_PLAN_FORM);
      refreshPlans();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminSubscriptionPlan(id, payload),
    onSuccess: () => {
      toast.success("Subscription plan updated.");
      setEditingPlanId(null);
      setPlanForm(EMPTY_PLAN_FORM);
      refreshPlans();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deleteAdminSubscriptionPlan,
    onSuccess: () => {
      toast.success("Subscription plan removed.");
      refreshPlans();
    },
  });

  const planMutationBusy =
    createPlanMutation.isPending || updatePlanMutation.isPending;

  const planPayload = useMemo(() => {
    const features = String(planForm.features || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      name: planForm.name.trim(),
      slug: planForm.slug.trim(),
      billing_cycle: planForm.billing_cycle,
      price: Number(planForm.price || 0),
      duration_days: Number(planForm.duration_days || 0),
      description: planForm.description.trim(),
      features,
      sort_order: Number(planForm.sort_order || 0),
      is_active: Boolean(planForm.is_active),
    };
  }, [planForm]);

  const submitPlanForm = () => {
    if (!planPayload.name || !planPayload.slug) {
      toast.error("Plan name and slug are required.");
      return;
    }
    if (!planPayload.price || !planPayload.duration_days) {
      toast.error("Price and duration must be greater than zero.");
      return;
    }

    if (editingPlanId) {
      updatePlanMutation.mutate({ id: editingPlanId, payload: planPayload });
      return;
    }
    createPlanMutation.mutate(planPayload);
  };

  const startEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name || "",
      slug: plan.slug || "",
      billing_cycle: plan.billing_cycle || "monthly",
      price: String(plan.price ?? ""),
      duration_days: String(plan.duration_days ?? ""),
      description: plan.description || "",
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      sort_order: String(plan.sort_order ?? 0),
      is_active: Boolean(plan.is_active),
    });
  };

  const clearPlanEditor = () => {
    setEditingPlanId(null);
    setPlanForm(EMPTY_PLAN_FORM);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">
            Subscription plan management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, edit, activate, deactivate, and remove plans available to customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={planForm.name}
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Plan name"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            value={planForm.slug}
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="Slug (e.g. monthly-plan)"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <select
            value={planForm.billing_cycle}
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, billing_cycle: e.target.value }))
            }
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          >
            {CYCLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={planForm.price}
            type="number"
            min="1"
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="Price (ETB)"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            value={planForm.duration_days}
            type="number"
            min="1"
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, duration_days: e.target.value }))
            }
            placeholder="Duration (days)"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            value={planForm.sort_order}
            type="number"
            min="0"
            onChange={(e) =>
              setPlanForm((prev) => ({ ...prev, sort_order: e.target.value }))
            }
            placeholder="Sort order"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
        </div>

        <textarea
          value={planForm.description}
          onChange={(e) =>
            setPlanForm((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          placeholder="Short description"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
        />
        <textarea
          value={planForm.features}
          onChange={(e) =>
            setPlanForm((prev) => ({ ...prev, features: e.target.value }))
          }
          rows={4}
          placeholder="Features (one per line)"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={planForm.is_active}
              onChange={(e) =>
                setPlanForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
            />
            Active plan
          </label>
          <button
            type="button"
            onClick={submitPlanForm}
            disabled={planMutationBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4c84a4] hover:bg-[#3b6a86] text-white font-semibold disabled:opacity-60"
          >
            <PlusCircle size={16} />
            {editingPlanId ? "Update plan" : "Create plan"}
          </button>
          {editingPlanId ? (
            <button
              type="button"
              onClick={clearPlanEditor}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <input
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="Search plan by name or slug..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Plan</th>
                  <th className="px-4 py-2 text-left font-semibold">Cycle</th>
                  <th className="px-4 py-2 text-left font-semibold">Price</th>
                  <th className="px-4 py-2 text-left font-semibold">Duration</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {plansLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                      Loading plans...
                    </td>
                  </tr>
                ) : adminPlans.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                      No subscription plans found.
                    </td>
                  </tr>
                ) : (
                  adminPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-4 py-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {plan.name}
                        </p>
                        <p className="text-xs text-gray-500">{plan.slug}</p>
                      </td>
                      <td className="px-4 py-2 capitalize">{plan.billing_cycle}</td>
                      <td className="px-4 py-2">ETB {Number(plan.price || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">{plan.duration_days} days</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${
                            plan.is_active
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {plan.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditPlan(plan)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                          >
                            <PencilLine size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${plan.name}?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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

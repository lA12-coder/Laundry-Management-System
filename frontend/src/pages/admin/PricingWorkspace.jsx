import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Percent, Shirt } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Permission } from "../../lib/rbac";
import { useToast } from "../../components/admin/ToastContainer";
import PricingMatrix from "../../components/admin/pricing/PricingMatrix";
import BulkPriceUpdateModal from "../../components/admin/pricing/BulkPriceUpdateModal";
import QuickAddPriceCard from "../../components/admin/pricing/QuickAddPriceCard";
import CategoryManager from "../../components/admin/pricing/CategoryManager";
import {
  bulkUpdatePrices,
  createPriceListEntry,
  deactivatePriceListEntry,
  fetchAdminPriceList,
  pricingQueryKeys,
  updatePriceListEntry,
} from "../../services/pricingApi";
import {
  categoryQueryKeys,
  fetchPriceCategories,
} from "../../services/categoriesApi";

export default function PricingWorkspace() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canEdit = hasPermission(Permission.EDIT_PRICING);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: categoryQueryKeys.admin,
    queryFn: fetchPriceCategories,
    staleTime: 30_000,
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: pricingQueryKeys.admin,
    queryFn: fetchAdminPriceList,
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: pricingQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: createPriceListEntry,
    onSuccess: () => {
      invalidateAll();
      toast.success("Item added", "Catalogue entry created.");
    },
    onError: (err) => {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : null) ||
        err.message;
      toast.error("Create failed", detail);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePriceListEntry(id, payload),
    onSuccess: () => {
      invalidateAll();
      toast.success("Saved", "Prices updated.");
    },
    onError: (err) => {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : null) ||
        err.message;
      toast.error("Update failed", detail);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivatePriceListEntry,
    onSuccess: () => {
      invalidateAll();
      toast.success("Deactivated", "Item removed from active catalogue.");
    },
    onError: () => toast.error("Failed", "Could not deactivate item."),
  });

  const bulkMutation = useMutation({
    mutationFn: bulkUpdatePrices,
    onSuccess: (res) => {
      invalidateAll();
      setBulkOpen(false);
      toast.success(
        "Bulk update applied",
        `${res.updated ?? 0} rows adjusted at ×${res.multiplier}`,
      );
    },
    onError: (err) =>
      toast.error("Bulk failed", err.response?.data?.detail || err.message),
  });

  const handleSaveRow = async (id, values) => {
    setSavingId(id);
    try {
      await updateMutation.mutateAsync({ id, payload: values });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeactivate = (id) => {
    if (window.confirm("Deactivate this catalogue row? Historical orders keep snapshots.")) {
      deactivateMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shirt className="text-[#4c84a4]" size={26} />
            Price matrix
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">
            Manage categories and cloth catalogue entries that flow into{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">ClothItem</code> line items.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#4c84a4] text-[#4c84a4] rounded-xl text-sm font-bold hover:bg-blue-50"
          >
            <Percent size={16} />
            Bulk adjustment
          </button>
        )}
      </div>

      {!canEdit && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          View-only mode — contact an administrator to edit catalogue pricing.
        </p>
      )}

      <CategoryManager canEdit={canEdit} onCategoriesChange={invalidateAll} />

      <QuickAddPriceCard
        canEdit={canEdit}
        categories={categories}
        isPending={createMutation.isPending}
        onCreate={(payload, { onSuccess }) =>
          createMutation.mutate(payload, { onSuccess })
        }
      />

      <PricingMatrix
        entries={entries}
        categories={categories}
        isLoading={entriesLoading || categoriesLoading}
        canEdit={canEdit}
        savingId={savingId}
        onSaveRow={handleSaveRow}
        onDeactivateRow={handleDeactivate}
      />

      <BulkPriceUpdateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        isPending={bulkMutation.isPending}
        categories={categories}
        onSubmit={(payload) => bulkMutation.mutate(payload)}
      />
    </div>
  );
}

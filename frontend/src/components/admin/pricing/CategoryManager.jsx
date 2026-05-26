import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderPlus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  Layers,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  categoryQueryKeys,
  createPriceCategory,
  deletePriceCategory,
  fetchPriceCategories,
  sortCategories,
  updatePriceCategory,
} from "../../../services/categoriesApi";
import {
  clothCategorySchema,
  clothCategoryPatchSchema,
} from "../../../schemas/categorySchemas";
import { SkeletonCard } from "../orders/SkeletonCard";

function CategoryForm({ defaultValues, onSubmit, onCancel, isPending, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clothCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      sort_order: 0,
      is_active: true,
      ...defaultValues,
    },
  });

  const fieldCls =
    "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Name
        </label>
        <input {...register("name")} className={fieldCls} placeholder="e.g. Premium" />
        {errors.name && (
          <p className="text-[10px] text-red-500 mt-0.5">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={2}
          className={fieldCls}
          placeholder="Optional notes for staff"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Sort order
          </label>
          <input
            type="number"
            min="0"
            {...register("sort_order")}
            className={fieldCls}
          />
          {errors.sort_order && (
            <p className="text-[10px] text-red-500">{errors.sort_order.message}</p>
          )}
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" {...register("is_active")} className="rounded" />
            Active
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-semibold text-gray-500 dark:text-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4c84a4] text-white rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function EditCategoryRow({ category, canEdit, onSave, onDelete, isSaving, isDeleting }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(clothCategoryPatchSchema),
    defaultValues: {
      name: category.name,
      description: category.description || "",
      sort_order: category.sort_order,
      is_active: category.is_active,
    },
  });

  if (!canEdit) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {category.name}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {category.entry_count ?? 0} items
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSave(category.id, values))}
      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50"
    >
      <div className="sm:col-span-3">
        <input
          {...register("name")}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg"
        />
        {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
      </div>
      <div className="sm:col-span-4">
        <input
          {...register("description")}
          placeholder="Description"
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>
      <div className="sm:col-span-1">
        <input
          type="number"
          min="0"
          {...register("sort_order")}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <input type="checkbox" {...register("is_active")} className="rounded" />
          Active
        </label>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {category.entry_count ?? 0} SKUs
        </span>
      </div>
      <div className="sm:col-span-2 flex justify-end gap-1">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40"
          title="Save"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          disabled={isDeleting}
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Admin CRUD for cloth categories powering the price matrix.
 */
export default function CategoryManager({ canEdit, onCategoriesChange }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: categoryQueryKeys.admin,
    queryFn: fetchPriceCategories,
    staleTime: 60_000,
  });

  const sorted = sortCategories(categories);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    onCategoriesChange?.();
  };

  const createMutation = useMutation({
    mutationFn: createPriceCategory,
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePriceCategory(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceCategory,
    onSuccess: invalidate,
  });

  const handleDelete = (category) => {
    const count = category.entry_count ?? 0;
    const msg =
      count > 0
        ? `Category "${category.name}" has ${count} catalogue item(s). Delete is blocked — deactivate it instead?`
        : `Permanently delete category "${category.name}"?`;
    if (!window.confirm(msg)) return;
    if (count > 0) {
      updateMutation.mutate({
        id: category.id,
        payload: { is_active: false },
      });
      return;
    }
    setDeletingId(category.id);
    deleteMutation.mutate(category.id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const handleSave = async (id, values) => {
    setSavingId(id);
    try {
      await updateMutation.mutateAsync({ id, payload: values });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <SkeletonCard lines={4} className="min-h-[120px]" />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="text-[#4c84a4] dark:text-sky-300" size={20} />
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">
              Cloth categories
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Create, edit, and delete groupings for the price matrix
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
              showCreate
                ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                : "bg-[#4c84a4] text-white hover:bg-[#3a6680]",
            )}
          >
            {showCreate ? <X size={16} /> : <FolderPlus size={16} />}
            {showCreate ? "Close" : "New category"}
          </button>
        )}
      </div>

      {showCreate && canEdit && (
        <div className="border border-dashed border-[#4c84a4]/30 rounded-xl p-4 bg-blue-50/30 dark:bg-sky-950/20">
          <CategoryForm
            defaultValues={{ sort_order: (sorted.length + 1) * 10 }}
            submitLabel="Create category"
            isPending={createMutation.isPending}
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
            No categories yet. Create one to organize your catalogue.
          </p>
        ) : (
          sorted.map((cat) => (
            <EditCategoryRow
              key={cat.id}
              category={cat}
              canEdit={canEdit}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={savingId === cat.id}
              isDeleting={deletingId === cat.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

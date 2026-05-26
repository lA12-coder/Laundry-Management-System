import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Percent, Loader2 } from "lucide-react";
import { buildBulkPriceUpdateSchema } from "../../../schemas/priceListSchemas";
import {
  CLOTH_SIZE_VALUES,
  CLOTH_SIZE_LABELS,
} from "../../../constants/priceCategories";
import { sortCategories } from "../../../services/categoriesApi";

export default function BulkPriceUpdateModal({
  open,
  onClose,
  onSubmit,
  isPending,
  categories,
}) {
  const activeCategories = useMemo(
    () => sortCategories(categories.filter((c) => c.is_active)),
    [categories],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildBulkPriceUpdateSchema()),
    defaultValues: {
      categories: [],
      sizes: [],
      percentChange: 10,
      applyTo: "both",
      activeOnly: true,
    },
  });

  if (!open) return null;

  const submit = (values) => {
    const multiplier = 1 + values.percentChange / 100;
    onSubmit({
      categories: values.categories.map(Number),
      sizes: values.sizes?.length ? values.sizes : undefined,
      multiplier,
      apply_to: values.applyTo,
      active_only: values.activeOnly,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Percent className="text-[#4c84a4] dark:text-sky-300" size={20} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bulk price adjustment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Categories
            </p>
            {activeCategories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No active categories available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      value={cat.id}
                      {...register("categories")}
                      className="rounded text-[#4c84a4]"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
            {errors.categories && (
              <p className="text-xs text-red-500 mt-1">{errors.categories.message}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Sizes (optional — all if empty)
            </p>
            <div className="flex flex-wrap gap-2">
              {CLOTH_SIZE_VALUES.map((size) => (
                <label
                  key={size}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200"
                >
                  <input
                    type="checkbox"
                    value={size}
                    {...register("sizes")}
                    className="rounded text-[#4c84a4]"
                  />
                  {CLOTH_SIZE_LABELS[size]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % change
              </label>
              <input
                type="number"
                step="0.1"
                {...register("percentChange")}
                className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-bold"
                placeholder="e.g. 10 for +10%"
              />
              {errors.percentChange && (
                <p className="text-xs text-red-500 mt-1">{errors.percentChange.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Apply to
              </label>
              <select
                {...register("applyTo")}
                className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-semibold"
              >
                <option value="both">Fua Price + Partner</option>
                <option value="fua_price">Fua Price only</option>
                <option value="partner_price">Partner only</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" {...register("activeOnly")} className="rounded" />
            Active catalogue rows only
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || activeCategories.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#4c84a4] text-white rounded-xl text-sm font-bold disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Apply multiplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

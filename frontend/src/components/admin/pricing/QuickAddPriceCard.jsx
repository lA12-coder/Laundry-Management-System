import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { buildPriceListEntrySchema } from "../../../schemas/priceListSchemas";
import {
  CLOTH_SIZE_VALUES,
  CLOTH_SIZE_LABELS,
  ClothSize,
} from "../../../constants/priceCategories";
import { sortCategories } from "../../../services/categoriesApi";
import CatalogImageUpload from "./CatalogImageUpload";

export default function QuickAddPriceCard({ canEdit, categories, onCreate, isPending }) {
  const activeCategories = useMemo(
    () => sortCategories(categories.filter((c) => c.is_active)),
    [categories],
  );

  const defaultCategoryId = activeCategories[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildPriceListEntrySchema()),
    defaultValues: {
      cloth_name: "",
      category: defaultCategoryId,
      size: ClothSize.MEDIUM,
      fua_price: 150,
      partner_price: 100,
      is_active: true,
    },
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);

  if (!canEdit) return null;

  if (activeCategories.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
        Add a category before creating catalogue items.
      </div>
    );
  }

  const submit = (values) => {
    if (imageError) return;
    onCreate(
      {
        ...values,
        category: Number(values.category),
        ...(imageFile ? { image: imageFile } : {}),
      },
      {
        onSuccess: () => {
          reset({
            cloth_name: "",
            category: defaultCategoryId,
            size: ClothSize.MEDIUM,
            fua_price: 150,
            partner_price: 100,
            is_active: true,
          });
          setImageFile(null);
          setImageError(null);
        },
      },
    );
  };

  const fieldCls =
    "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/30 dark:focus:ring-sky-500/30 outline-none";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Plus size={18} className="text-[#4c84a4] dark:text-sky-300" />
        Quick-add catalogue item
      </h3>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <CatalogImageUpload
          file={imageFile}
          onFileChange={(file, err) => {
            setImageFile(file);
            setImageError(err);
          }}
          onClear={() => {
            setImageFile(null);
            setImageError(null);
          }}
          error={imageError}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Cloth name
          </label>
          <input {...register("cloth_name")} className={fieldCls} placeholder="e.g. Dress shirt" />
          {errors.cloth_name && (
            <p className="text-[10px] text-red-500">{errors.cloth_name.message}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Category
          </label>
          <select {...register("category")} className={fieldCls}>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-[10px] text-red-500">{errors.category.message}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Size
          </label>
          <select {...register("size")} className={fieldCls}>
            {CLOTH_SIZE_VALUES.map((s) => (
              <option key={s} value={s}>
                {CLOTH_SIZE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Fua Price ETB
          </label>
          <input type="number" step="0.01" {...register("fua_price")} className={fieldCls} />
          {errors.fua_price && (
            <p className="text-[10px] text-red-500">{errors.fua_price.message}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Partner ETB
          </label>
          <input
            type="number"
            step="0.01"
            {...register("partner_price")}
            className={fieldCls}
          />
          {errors.partner_price && (
            <p className="text-[10px] text-red-500">{errors.partner_price.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending || Boolean(imageError)}
          className="h-[42px] px-4 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add
        </button>
        </div>
      </form>
    </div>
  );
}

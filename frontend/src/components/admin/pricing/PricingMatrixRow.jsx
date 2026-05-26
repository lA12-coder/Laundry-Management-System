import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { buildPriceListPatchSchema } from "../../../schemas/priceListSchemas";
import { CLOTH_SIZE_LABELS } from "../../../constants/priceCategories";
import CatalogImageUpload from "./CatalogImageUpload";

export default function PricingMatrixRow({
  entry,
  categories,
  canEdit,
  onSave,
  onDeactivate,
  isSaving,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(buildPriceListPatchSchema()),
    defaultValues: {
      cloth_name: entry.cloth_name,
      category: entry.category,
      size: entry.size,
      fua_price: Number(entry.fua_price),
      partner_price: Number(entry.partner_price),
      is_active: entry.is_active,
    },
  });

  useEffect(() => {
    reset({
      cloth_name: entry.cloth_name,
      category: entry.category,
      size: entry.size,
      fua_price: Number(entry.fua_price),
      partner_price: Number(entry.partner_price),
      is_active: entry.is_active,
    });
  }, [entry, reset]);

  const [imageFile, setImageFile] = useState(null);
  const [clearImage, setClearImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    setImageFile(null);
    setClearImage(false);
    setImageError(null);
  }, [entry.id, entry.image_url, entry.image, entry.updated_at]);

  const hasImageChange = Boolean(imageFile) || clearImage;

  const submit = (values) => {
    if (imageError) return;
    const payload = {
      ...values,
      category: values.category ?? entry.category,
      fua_price: Number(values.fua_price),
      partner_price: Number(values.partner_price),
    };
    if (imageFile) payload.image = imageFile;
    if (clearImage) payload.clear_image = true;
    onSave(entry.id, payload);
  };

  const inputCls =
    "w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4c84a4]/30 outline-none disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <tr
      className={cn(
        "border-b border-gray-50 transition-colors",
        !entry.is_active && "opacity-60 bg-gray-50/80",
      )}
    >
      <td className="px-3 py-3.5 align-middle w-[100px]">
        <CatalogImageUpload
          existingUrl={entry.image_url || entry.image}
          file={imageFile}
          compact
          disabled={!canEdit}
          error={imageError}
          onFileChange={(file, err) => {
            setImageFile(file);
            setImageError(err);
            if (file) setClearImage(false);
          }}
          onClear={() => {
            setImageFile(null);
            setClearImage(true);
            setImageError(null);
          }}
        />
      </td>
      <td className="px-3 py-3.5 align-middle min-w-[140px]">
        <input
          {...register("cloth_name")}
          disabled={!canEdit}
          className={inputCls}
        />
        {errors.cloth_name && (
          <p className="text-[10px] text-red-500 mt-0.5">{errors.cloth_name.message}</p>
        )}
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="text-xs font-bold text-gray-500 uppercase">
          {CLOTH_SIZE_LABELS[entry.size] || entry.size}
        </span>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <input
          type="number"
          step="0.01"
          min="0.01"
          {...register("fua_price", { valueAsNumber: true })}
          disabled={!canEdit}
          className={cn(inputCls, "font-bold text-[#4c84a4]")}
        />
        {errors.fua_price && (
          <p className="text-[10px] text-red-500 mt-0.5">{errors.fua_price.message}</p>
        )}
      </td>
      <td className="px-3 py-3.5 align-middle">
        <input
          type="number"
          step="0.01"
          min="0.01"
          {...register("partner_price", { valueAsNumber: true })}
          disabled={!canEdit}
          className={inputCls}
        />
        {errors.partner_price && (
          <p className="text-[10px] text-red-500 mt-0.5">
            {errors.partner_price.message}
          </p>
        )}
      </td>
      <td className="px-3 py-3.5 align-middle text-xs text-gray-500 font-semibold">
        {entry.fua_price && entry.partner_price
          ? `${(
              ((Number(entry.fua_price) - Number(entry.partner_price)) /
                Number(entry.fua_price)) *
              100
            ).toFixed(0)}% margin`
          : "—"}
      </td>
      <td className="px-3 py-3.5 align-middle">
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={(!isDirty && !hasImageChange) || isSaving || Boolean(imageError)}
              onClick={handleSubmit(submit)}
              className="p-2 rounded-lg text-[#4c84a4] hover:bg-blue-50 disabled:opacity-40"
              title="Save row"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDeactivate(entry.id)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              title="Deactivate"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

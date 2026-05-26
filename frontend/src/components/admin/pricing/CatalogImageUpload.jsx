import { useEffect, useId, useRef } from "react";
import { ImagePlus, Shirt, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { resolveCatalogImageUrl } from "../../../lib/mediaUrl";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Catalogue cloth image picker with preview (create + edit flows).
 */
export default function CatalogImageUpload({
  existingUrl,
  file,
  onFileChange,
  onClear,
  disabled = false,
  compact = false,
  error,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const objectUrl = file ? URL.createObjectURL(file) : null;
  const previewUrl = objectUrl || resolveCatalogImageUrl(existingUrl);

  useEffect(() => {
    if (!objectUrl) return undefined;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const handlePick = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      onFileChange(null, "Image must be 5 MB or smaller.");
      return;
    }
    if (!ACCEPT.split(",").includes(picked.type)) {
      onFileChange(null, "Use JPEG, PNG, or WebP only.");
      return;
    }
    onFileChange(picked, null);
  };

  const boxCls = compact ? "h-16 w-16" : "h-24 w-24 sm:h-28 sm:w-28";

  return (
    <div className={cn("flex flex-col gap-1.5", compact ? "items-center" : "")}>
      {!compact && (
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Cloth image
        </span>
      )}
      <div className={cn("flex items-center gap-3", compact && "flex-col")}>
        <div
          className={cn(
            "rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0",
            boxCls,
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Shirt className="text-gray-300 dark:text-gray-600" size={compact ? 22 : 32} />
          )}
        </div>

        {!disabled && (
          <div className={cn("flex flex-col gap-1.5", compact && "items-center")}>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={handlePick}
            />
            <label
              htmlFor={inputId}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer",
                "border border-[#4c84a4] text-[#4c84a4] hover:bg-blue-50",
              )}
            >
              <ImagePlus size={14} />
              {previewUrl ? "Replace" : "Upload"}
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  onClear?.();
                  onFileChange(null, null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600"
              >
                <X size={12} />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

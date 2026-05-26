import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Settings, Truck } from "lucide-react";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { Permission } from "../../lib/rbac";
import { useToast } from "../../components/admin/ToastContainer";
import SystemPreferencesPanel from "../../components/admin/SystemPreferencesPanel";
import {
  describeRiderFeeConfig,
  fetchSystemConfig,
  systemConfigInvalidationTargets,
  systemConfigQueryKeys,
  updateSystemConfig,
} from "../../services/systemConfigApi";

const configSchema = z
  .object({
    rider_fee_mode: z.enum(["fixed", "percent"]),
    rider_fee_fixed_amount: z.coerce.number().min(0).max(9999999999.99),
    rider_fee_percent: z.coerce.number().min(0).max(100),
  })
  .superRefine((data, ctx) => {
    if (data.rider_fee_mode === "fixed" && data.rider_fee_fixed_amount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a positive fixed amount",
        path: ["rider_fee_fixed_amount"],
      });
    }
    if (data.rider_fee_mode === "percent" && data.rider_fee_percent <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a positive percentage",
        path: ["rider_fee_percent"],
      });
    }
  });

export default function AdminSettings() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: systemConfigQueryKeys.all,
    queryFn: fetchSystemConfig,
    enabled: hasPermission(Permission.MANAGE_SETTINGS),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      rider_fee_mode: "percent",
      rider_fee_fixed_amount: 50,
      rider_fee_percent: 10,
    },
  });

  const mode = watch("rider_fee_mode");

  useEffect(() => {
    if (config) {
      reset({
        rider_fee_mode: config.rider_fee_mode ?? "percent",
        rider_fee_fixed_amount: Number(config.rider_fee_fixed_amount ?? 50),
        rider_fee_percent: Number(config.rider_fee_percent ?? 10),
      });
    }
  }, [config, reset]);

  const saveMutation = useMutation({
    mutationFn: updateSystemConfig,
    onSuccess: (saved) => {
      queryClient.setQueryData(systemConfigQueryKeys.all, saved);
      systemConfigInvalidationTargets.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      toast.success("Settings saved", describeRiderFeeConfig(saved));
      reset({
        rider_fee_mode: saved.rider_fee_mode,
        rider_fee_fixed_amount: Number(saved.rider_fee_fixed_amount),
        rider_fee_percent: Number(saved.rider_fee_percent),
      });
    },
    onError: (err) =>
      toast.error(
        "Save failed",
        err.response?.data?.detail || err.message || "Could not update settings.",
      ),
  });

  if (!hasPermission(Permission.MANAGE_SETTINGS)) {
    return null;
  }

  const fieldCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-950 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:bg-zinc-900 dark:border-zinc-600 dark:text-slate-100";

  return (
    <div className="space-y-6 max-w-2xl pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-[#4c84a4]" size={26} />
          System settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Super Admin configuration. Changes apply to new transaction splits when orders
          reach washing or delivered.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 dark:bg-zinc-800 dark:border-zinc-700"
      >
        <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
          <div className="p-2 rounded-xl bg-amber-50">
            <Truck size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900">Rider / logistics fee</h2>
            <p className="text-xs text-gray-500">
              Deducted from each order before Fua commission and partner payout.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading configuration…</p>
        ) : (
          <>
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Fee type
              </legend>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="percent"
                  {...register("rider_fee_mode")}
                  className="text-[#4c84a4]"
                />
                <span className="text-sm text-gray-800">
                  Percentage of order total{" "}
                  <span className="text-gray-400">(default 10%)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="fixed"
                  {...register("rider_fee_mode")}
                  className="text-[#4c84a4]"
                />
                <span className="text-sm text-gray-800">Fixed amount per order (ETB)</span>
              </label>
            </fieldset>

            {mode === "percent" ? (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Commission rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  {...register("rider_fee_percent")}
                  className={fieldCls}
                />
                {errors.rider_fee_percent && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.rider_fee_percent.message}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Fixed fee (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("rider_fee_fixed_amount")}
                  className={fieldCls}
                />
                {errors.rider_fee_fixed_amount && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.rider_fee_fixed_amount.message}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              Fua commission = order total − partner total − rider fee. Existing settled
              logs keep the fee recorded at settlement time.
            </p>

            <button
              type="submit"
              disabled={!isDirty || saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4c84a4] text-white rounded-xl text-sm font-bold hover:bg-[#3a6680] disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save settings
            </button>
          </>
        )}
      </form>

      <SystemPreferencesPanel config={config} isLoading={isLoading} />
    </div>
  );
}

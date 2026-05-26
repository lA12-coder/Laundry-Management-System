import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Radio, Save, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { useToast } from "./ToastContainer";
import {
  systemConfigInvalidationTargets,
  systemConfigQueryKeys,
  updateSystemConfig,
} from "../../services/systemConfigApi";

const prefsSchema = z.object({
  auto_assign_riders: z.boolean(),
  urgent_orders_first: z.boolean(),
  dispatch_radius_km: z.coerce.number().min(0).max(9999.99),
  max_daily_orders_cap: z.coerce.number().min(0).max(1_000_000),
  default_notify_channel: z.enum(["sms", "email", "both"]),
  platform_sms_enabled: z.boolean(),
  platform_email_enabled: z.boolean(),
});

  const fieldCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-950 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:bg-zinc-900 dark:border-zinc-600 dark:text-slate-100";

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-50 dark:border-gray-800 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
      <span>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#4c84a4]"
      />
    </label>
  );
}

export default function SystemPreferencesPanel({ config, isLoading }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      auto_assign_riders: true,
      urgent_orders_first: true,
      dispatch_radius_km: 15,
      max_daily_orders_cap: 500,
      default_notify_channel: "both",
      platform_sms_enabled: true,
      platform_email_enabled: true,
    },
  });

  useEffect(() => {
    if (!config) return;
    reset({
      auto_assign_riders: config.auto_assign_riders ?? true,
      urgent_orders_first: config.urgent_orders_first ?? true,
      dispatch_radius_km: Number(config.dispatch_radius_km ?? 15),
      max_daily_orders_cap: Number(config.max_daily_orders_cap ?? 500),
      default_notify_channel: config.default_notify_channel ?? "both",
      platform_sms_enabled: config.platform_sms_enabled ?? true,
      platform_email_enabled: config.platform_email_enabled ?? true,
    });
  }, [config, reset]);

  const saveMutation = useMutation({
    mutationFn: updateSystemConfig,
    onSuccess: (saved) => {
      queryClient.setQueryData(systemConfigQueryKeys.all, saved);
      systemConfigInvalidationTargets.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      toast.success("Operational preferences saved");
      reset({
        auto_assign_riders: saved.auto_assign_riders,
        urgent_orders_first: saved.urgent_orders_first,
        dispatch_radius_km: Number(saved.dispatch_radius_km),
        max_daily_orders_cap: Number(saved.max_daily_orders_cap),
        default_notify_channel: saved.default_notify_channel,
        platform_sms_enabled: saved.platform_sms_enabled,
        platform_email_enabled: saved.platform_email_enabled,
      });
    },
    onError: (err) =>
      toast.error(
        "Save failed",
        err.response?.data?.detail || err.message || "Could not update preferences.",
      ),
  });

  const smsOn = watch("platform_sms_enabled");
  const emailOn = watch("platform_email_enabled");

  return (
    <form
      onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 dark:bg-zinc-800 dark:border-zinc-700"
    >
      <div className="flex items-center gap-3 pb-2 border-b border-gray-50 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
          <SlidersHorizontal size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">Global operational preferences</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Routing, dispatch boundaries, daily caps, and platform notification channels.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading preferences…</p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Rider routing
            </legend>
            <ToggleRow
              label="Auto-assign riders"
              description="Assign least-loaded rider when a new order is created"
              checked={watch("auto_assign_riders")}
              onChange={(v) => setValue("auto_assign_riders", v, { shouldDirty: true })}
            />
            <ToggleRow
              label="Prioritize urgent orders"
              description="Favor riders with fewer active urgent assignments"
              checked={watch("urgent_orders_first")}
              onChange={(v) => setValue("urgent_orders_first", v, { shouldDirty: true })}
            />
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Dispatch radius (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("dispatch_radius_km")}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Max daily orders (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                {...register("max_daily_orders_cap")}
                className={fieldCls}
              />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Radio size={12} /> Communication defaults
            </legend>
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input type="radio" value="sms" {...register("default_notify_channel")} />
              SMS primary
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input type="radio" value="email" {...register("default_notify_channel")} />
              Email primary
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input type="radio" value="both" {...register("default_notify_channel")} />
              SMS and email
            </label>
            <ToggleRow
              label="Platform SMS enabled"
              checked={smsOn}
              onChange={(v) => setValue("platform_sms_enabled", v, { shouldDirty: true })}
            />
            <ToggleRow
              label="Platform email enabled"
              checked={emailOn}
              onChange={(v) => setValue("platform_email_enabled", v, { shouldDirty: true })}
            />
          </fieldset>

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
            Save operational preferences
          </button>
        </>
      )}
    </form>
  );
}

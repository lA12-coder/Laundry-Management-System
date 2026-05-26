import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  claimAccount,
  ghostAccountQueryKeys,
  normalizePhoneInput,
} from "../../services/ghostAccountApi";
import { notificationQueryKeys } from "../../services/notificationApi";
import { loginSuccess } from "../../redux/userSlice";

const claimSchema = z
  .object({
    phone_number: z.string().min(9, "Enter your phone number"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string().min(8, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.password_confirm) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["password_confirm"],
      });
    }
  });

const fieldCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#4c84a4] focus:bg-white focus:ring-2 focus:ring-[#4c84a4]/20";

export default function AccountClaimForm({ defaultPhone = "", onSuccess }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      phone_number: defaultPhone || user?.phone_number || "",
      email: user?.email || "",
      password: "",
      password_confirm: "",
    },
  });

  const claimMutation = useMutation({
    mutationFn: claimAccount,
    onSuccess: (payload) => {
      dispatch(
        loginSuccess({
          user: payload.user,
          token: payload.access,
          refreshToken: payload.refresh,
        }),
      );
      queryClient.invalidateQueries({ queryKey: ghostAccountQueryKeys.me });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      toast.success(
        payload.orders_linked
          ? `Account secured — ${payload.orders_linked} order(s) linked.`
          : "Account secured successfully.",
      );
      onSuccess?.(payload);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.phone_number?.[0] ||
        "Could not claim account. Check your phone and password.";
      toast.error(msg);
    },
  });

  const onSubmit = (values) => {
    claimMutation.mutate({
      phone_number: normalizePhoneInput(values.phone_number),
      password: values.password,
      password_confirm: values.password_confirm,
      email: values.email || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
        <div className="rounded-xl bg-blue-50 p-2">
          <ShieldCheck className="text-[#4c84a4]" size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">Claim your account</h2>
          <p className="text-sm text-gray-500">
            Match the phone used at checkout and set a password to keep your order history.
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Phone (must match guest profile)
        </label>
        <input type="tel" {...register("phone_number")} className={fieldCls} />
        {errors.phone_number && (
          <p className="mt-1 text-xs text-red-500">{errors.phone_number.message}</p>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Email (optional)
        </label>
        <input type="email" {...register("email")} className={fieldCls} />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          New password
        </label>
        <input type="password" autoComplete="new-password" {...register("password")} className={fieldCls} />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Confirm password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          {...register("password_confirm")}
          className={fieldCls}
        />
        {errors.password_confirm && (
          <p className="mt-1 text-xs text-red-500">{errors.password_confirm.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={claimMutation.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4c84a4] py-3 text-sm font-bold text-white hover:bg-[#3a6680] disabled:opacity-50"
      >
        {claimMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
        Activate account &amp; save orders
      </button>
    </form>
  );
}

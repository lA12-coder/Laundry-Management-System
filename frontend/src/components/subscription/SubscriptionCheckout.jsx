import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, UploadCloud, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  fetchSubscriptionPlans,
  submitSubscriptionCheckout,
  subscriptionQueryKeys,
} from "../../services/subscriptionApi";

const PAYMENT_RAILS = {
  cbeAccountNumber: "1000616637545",
  telebirrPhone: "+251931460438",
};

function PlanCard({ plan, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-[#4c84a4] hover:shadow-sm transition-all"
    >
      <p className="text-xs uppercase tracking-wider font-bold text-[#4c84a4]">
        {plan.billing_cycle}
      </p>
      <h3 className="text-xl font-black text-gray-900 mt-1">{plan.name}</h3>
      <p className="text-lg font-bold text-gray-800 mt-2">
        ETB {Number(plan.price || 0).toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Duration: {plan.duration_days} days
      </p>
    </button>
  );
}

export default function SubscriptionCheckout() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: subscriptionQueryKeys.plans,
    queryFn: fetchSubscriptionPlans,
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ planId, file }) =>
      submitSubscriptionCheckout({ planId, receiptFile: file }),
    onSuccess: () => {
      toast.success("Subscription submitted for admin approval.");
      setSelectedPlan(null);
      setReceiptFile(null);
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.customer });
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.adminQueue({}) });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Could not submit subscription receipt.",
      );
    },
  });

  const acceptedHint = useMemo(
    () =>
      receiptFile
        ? `${receiptFile.name} • ${Math.round(receiptFile.size / 1024)} KB`
        : "Upload JPG, PNG, or PDF receipt",
    [receiptFile],
  );

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <CreditCard className="text-[#4c84a4]" size={24} />
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Subscription Plans
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a plan and submit your receipt for offline payment approval.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
            ))}
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#4c84a4] font-bold">
                  {selectedPlan.billing_cycle} plan checkout
                </p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">
                  {selectedPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setReceiptFile(null);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Payment Instructions
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  Telebirr: <span className="font-bold">{PAYMENT_RAILS.telebirrPhone}</span>
                </p>
                <p className="text-sm text-gray-700">
                  CBE Account Number:{" "}
                  <span className="font-bold">{PAYMENT_RAILS.cbeAccountNumber}</span>
                </p>
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-wider font-bold text-gray-500">
                  Upload Receipt
                </span>
                <div className="mt-2 rounded-xl border-2 border-dashed border-gray-300 p-5 text-center">
                  <UploadCloud className="mx-auto text-gray-400" size={24} />
                  <p className="text-sm text-gray-600 mt-2">{acceptedHint}</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) =>
                      setReceiptFile(event.target.files?.[0] || null)
                    }
                    className="mt-3 text-sm"
                  />
                </div>
              </label>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setReceiptFile(null);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!receiptFile || checkoutMutation.isPending}
                onClick={() =>
                  checkoutMutation.mutate({
                    planId: selectedPlan.id,
                    file: receiptFile,
                  })
                }
                className="px-4 py-2 rounded-xl bg-[#4c84a4] text-white font-bold disabled:opacity-60"
              >
                {checkoutMutation.isPending
                  ? "Submitting..."
                  : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

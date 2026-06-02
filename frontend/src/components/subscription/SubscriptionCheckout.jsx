import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, CreditCard, UploadCloud, X } from "lucide-react";
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
  const cycleLabel = {
    weekly: "week",
    monthly: "month",
    yearly: "3-month", // Overridden dynamically to closely match user's image layout if needed
  }[plan.billing_cycle] || "period";

  // Use string containment check to accommodate variable naming conventions safely
  const isFeatured = String(plan.billing_cycle).toLowerCase().includes("monthly");
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      // Hover Lift & Box Shadow transformation matching the reference image's deep soft-shadows
      whileHover={{ 
        y: isFeatured ? -12 : -8,
        scale: 1.015,
        boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`rounded-[32px] px-8 py-12 flex flex-col justify-between h-full transition-colors select-none ${
        isFeatured
          ? "bg-[#3e7da3] text-white shadow-xl md:-translate-y-4"
          : "bg-white text-slate-900 border border-slate-100 shadow-md"
      }`}
    >
      <div>
        {/* Title Block matching 'Choose Your Plan' specifications */}
        <h3 className={`text-4xl font-bold text-center tracking-tight ${isFeatured ? "text-white" : "text-slate-900"}`}>
          {plan.name}
        </h3>

        {/* Pricing Layout */}
        <p className="mt-6 text-center leading-none">
          <span className={`text-3xl font-black tracking-tight ${isFeatured ? "text-white" : "text-slate-900"}`}>
            {Number(plan.price || 0).toLocaleString()} ETB
          </span>
          <span className={`text-sm font-medium ml-1 lowercase ${isFeatured ? "text-slate-200/90" : "text-slate-500"}`}>
            /{cycleLabel}
          </span>
        </p>

        {/* Features Checklist */}
        <div className="mt-10">
          <h4 className={`text-xl font-bold tracking-wide ${isFeatured ? "text-white" : "text-slate-800"}`}>
            Features
          </h4>
          <ul className="mt-6 space-y-4">
            {features.map((feature, idx) => (
              <li key={`${plan.id}-${idx}`} className="flex items-center gap-3.5 text-base">
                {/* Double Ring Check Effect simulated cleanly using CSS */}
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                  isFeatured ? "border-slate-200/70" : "border-[#3e7da3]"
                }`}>
                  <Check size={13} strokeWidth={3} className={isFeatured ? "text-white" : "text-[#3e7da3]"} />
                </div>
                <span className={`font-medium ${isFeatured ? "text-slate-100" : "text-slate-700"}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Button with Micro-spring action click handler */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onSelect(plan)}
        className={`mt-12 w-full rounded-2xl py-4 text-base font-bold tracking-wide shadow-sm border ${
          isFeatured
            ? "bg-white text-[#3e7da3] border-transparent hover:bg-slate-50"
            : "bg-[#3e7da3] text-white border-transparent hover:bg-[#346a8b]"
        }`}
      >
        Choose {plan.name.split(" ")[0]}
      </motion.button>
    </motion.article>
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
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not submit subscription receipt.");
    },
  });

  const acceptedHint = useMemo(
    () => receiptFile ? `${receiptFile.name} • ${Math.round(receiptFile.size / 1024)} KB` : "Upload JPG, PNG, or PDF receipt",
    [receiptFile]
  );

  return (
    <section className="py-24 bg-[#ffffff] font-sans">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Block exactly matching image typography hierarchy */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-base text-slate-700 font-normal mt-5 leading-relaxed">
            Register for our thoughtfully designed pickup and cleaning plans, offered at special discounts to keep your clothes fresh and your routine effortless.
          </p>
        </div>

        {/* Dynamic Card Container Grid layout */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-slate-400 animate-pulse">Loading plans…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
            ))}
          </div>
        )}
      </div>

      {/* Spring Animated Modal Layer */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#3e7da3] font-bold">
                  {selectedPlan.billing_cycle} checkout
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setReceiptFile(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-blue-50 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-sm">
                  <CreditCard size={16} className="text-[#3e7da3]" />
                  <span>Payment Instructions</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600 pl-6">
                  <p>Telebirr: <span className="font-semibold text-slate-900">{PAYMENT_RAILS.telebirrPhone}</span></p>
                  <p>CBE Account: <span className="font-semibold text-slate-900">{PAYMENT_RAILS.cbeAccountNumber}</span></p>
                </div>
              </div>

              <label className="block cursor-pointer">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upload Payment Receipt
                </span>
                <div className="mt-2.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#3e7da3] transition-colors p-6 text-center bg-slate-50/40">
                  <UploadCloud className="mx-auto text-slate-400" size={28} />
                  <p className="text-sm text-slate-600 font-medium mt-2">{acceptedHint}</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('receipt-upload').click()}
                    className="mt-3 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Browse Files
                  </button>
                </div>
              </label>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setReceiptFile(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={!receiptFile || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate({ planId: selectedPlan.id, file: receiptFile })}
                className="px-5 py-2.5 rounded-xl bg-[#3e7da3] text-white font-bold text-sm disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:bg-[#346a8b]"
              >
                {checkoutMutation.isPending ? "Submitting..." : "Submit for Approval"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
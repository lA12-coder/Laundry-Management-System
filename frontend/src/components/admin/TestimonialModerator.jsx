import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuote, Star } from "lucide-react";
import {
  engagementQueryKeys,
  fetchAdminTestimonials,
  updateTestimonialApproval,
} from "../../services/engagementApi";
import { useToast } from "./ToastContainer";

function ApprovalToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      } disabled:opacity-60`}
      aria-label="Toggle testimonial visibility"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function TestimonialModerator() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: engagementQueryKeys.adminTestimonials,
    queryFn: fetchAdminTestimonials,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isApproved }) => updateTestimonialApproval(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminTestimonials });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicTestimonials });
      toast.success("Testimonial visibility updated.");
    },
    onError: () => toast.error("Could not update testimonial visibility."),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-slate-100 flex items-center gap-2">
          <MessageSquareQuote className="text-[#4c84a4]" size={24} />
          Testimonial moderation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review customer feedback and control public homepage visibility.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Rating</th>
                <th className="text-left px-4 py-3 font-semibold">Review</th>
                <th className="text-left px-4 py-3 font-semibold">Public</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Loading testimonials...
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No testimonials available.
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="text-amber-500" />
                        {item.rating}/5
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xl">
                      {item.review_text}
                    </td>
                    <td className="px-4 py-3">
                      <ApprovalToggle
                        checked={Boolean(item.is_approved_for_public)}
                        disabled={toggleMutation.isPending}
                        onChange={() =>
                          toggleMutation.mutate({
                            id: item.id,
                            isApproved: !item.is_approved_for_public,
                          })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

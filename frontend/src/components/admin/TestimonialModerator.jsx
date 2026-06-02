import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuote, PencilLine, Star, Trash2 } from "lucide-react";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  engagementQueryKeys,
  fetchAdminTestimonials,
  updateAdminTestimonial,
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
  const [form, setForm] = useState({
    customer_name: "",
    rating: "5",
    review_text: "",
    is_approved_for_public: false,
    customer_image: null,
  });
  const [editingId, setEditingId] = useState(null);

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

  const createMutation = useMutation({
    mutationFn: createAdminTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminTestimonials });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicTestimonials });
      toast.success("Testimonial created.");
      setForm({
        customer_name: "",
        rating: "5",
        review_text: "",
        is_approved_for_public: false,
        customer_image: null,
      });
    },
    onError: () => toast.error("Could not create testimonial."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminTestimonial(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminTestimonials });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicTestimonials });
      toast.success("Testimonial updated.");
      setEditingId(null);
      setForm({
        customer_name: "",
        rating: "5",
        review_text: "",
        is_approved_for_public: false,
        customer_image: null,
      });
    },
    onError: () => toast.error("Could not update testimonial."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminTestimonials });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicTestimonials });
      toast.success("Testimonial deleted.");
    },
    onError: () => toast.error("Could not delete testimonial."),
  });

  const saveTestimonial = () => {
    const payload = {
      customer_name: form.customer_name.trim(),
      rating: Number(form.rating),
      review_text: form.review_text.trim(),
      is_approved_for_public: Boolean(form.is_approved_for_public),
      customer_image: form.customer_image,
    };
    if (!payload.customer_name || !payload.review_text) {
      toast.error("Customer name and testimonial text are required.");
      return;
    }
    if (payload.rating < 1 || payload.rating > 5) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      customer_name: item.customer_name || "",
      rating: String(item.rating ?? 5),
      review_text: item.review_text || "",
      is_approved_for_public: Boolean(item.is_approved_for_public),
      customer_image: null,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      customer_name: "",
      rating: "5",
      review_text: "",
      is_approved_for_public: false,
      customer_image: null,
    });
  };

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

      <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 md:p-5 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {editingId ? "Edit testimonial" : "Add testimonial"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.customer_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customer_name: e.target.value }))
            }
            placeholder="Customer name"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          />
          <select
            value={form.rating}
            onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} Star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={4}
          value={form.review_text}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, review_text: e.target.value }))
          }
          placeholder="Testimonial text"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
        />
        <div className="space-y-2">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Customer image (optional)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                customer_image: e.target.files?.[0] || null,
              }))
            }
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
          {editingId && !form.customer_image ? (
            <p className="text-xs text-slate-500">
              Leave empty to keep the current testimonial image.
            </p>
          ) : null}
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.is_approved_for_public}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                is_approved_for_public: e.target.checked,
              }))
            }
          />
          Approve for public homepage immediately
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveTestimonial}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#4c84a4] hover:bg-[#3a6f8f] text-white font-semibold text-sm disabled:opacity-60"
          >
            {editingId ? "Update testimonial" : "Create testimonial"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-semibold text-sm"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Photo</th>
                <th className="text-left px-4 py-3 font-semibold">Rating</th>
                <th className="text-left px-4 py-3 font-semibold">Review</th>
                <th className="text-left px-4 py-3 font-semibold">Public</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading testimonials...
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No testimonials available.
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-3">
                      {item.customer_image_url ? (
                        <img
                          src={item.customer_image_url}
                          alt={item.customer_name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No image</span>
                      )}
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          <PencilLine size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this testimonial?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
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

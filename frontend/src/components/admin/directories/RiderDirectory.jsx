import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Plus, Search, Trash2 } from "lucide-react";
import DirectoryTabs from "./DirectoryTabs";
import {
  createRider,
  deleteRider,
  directoryQueryKeys,
  fetchRiderDirectory,
  updateRider,
} from "../../../services/directoryApi";
import { useToast } from "../ToastContainer";
import { normalizePhoneInput } from "../../../lib/phone";

function AvailabilityBadge({ isOnline }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold">
      <span
        className={[
          "h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
          isOnline ? "bg-emerald-500 shadow-emerald-400/70" : "bg-gray-400 shadow-gray-400/40",
        ].join(" ")}
      />
      <span className={isOnline ? "text-emerald-600 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </span>
  );
}

export default function RiderDirectory() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [newRider, setNewRider] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const search = useMemo(() => searchInput.trim(), [searchInput]);
  const listKey = directoryQueryKeys.riders(search);

  const { data: riders = [], isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchRiderDirectory(search),
    staleTime: 20_000,
  });

  const invalidateRiders = () => {
    queryClient.invalidateQueries({ queryKey: ["adminDirectory", "riders"] });
  };

  const createMutation = useMutation({
    mutationFn: createRider,
    onSuccess: () => {
      setNewRider({ full_name: "", email: "", phone_number: "", password: "" });
      invalidateRiders();
      toast.success("Rider created", "New rider added to fleet.");
    },
    onError: (error) => {
      toast.error("Create failed", error.response?.data?.detail || "Could not create rider.");
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRider(id, payload),
    onSuccess: () => invalidateRiders(),
    onError: () => toast.error("Update failed", "Could not update rider."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRider,
    onSuccess: () => {
      invalidateRiders();
      toast.success("Rider removed", "Rider deleted from directory.");
    },
    onError: () => toast.error("Delete failed", "Could not delete rider."),
  });

  const handleCreate = (event) => {
    event.preventDefault();
    if (!newRider.full_name || !newRider.email || !newRider.phone_number) {
      toast.info("Name, email, and phone are required.");
      return;
    }
    try {
      createMutation.mutate({
        ...newRider,
        phone_number: normalizePhoneInput(newRider.phone_number),
      });
    } catch (error) {
      toast.error(error.message || "Use 09XXXXXXXX or +2519XXXXXXXX");
    }
  };

  return (
    <div className="space-y-6">
      <DirectoryTabs />

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bike className="text-[#4c84a4] dark:text-sky-400" size={24} />
              Rider fleet directory
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track active load and quickly manage rider availability.
            </p>
          </div>
          <label className="relative w-full lg:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search riders..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            type="text"
            value={newRider.full_name}
            onChange={(event) =>
              setNewRider((prev) => ({ ...prev, full_name: event.target.value }))
            }
            placeholder="Full name"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="email"
            value={newRider.email}
            onChange={(event) =>
              setNewRider((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="Email"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={newRider.phone_number}
            onChange={(event) =>
              setNewRider((prev) => ({ ...prev, phone_number: event.target.value }))
            }
            placeholder="Phone number"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="password"
            value={newRider.password}
            onChange={(event) =>
              setNewRider((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Optional password"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4c84a4] hover:bg-[#3e6f8b] text-white text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={15} />
            {createMutation.isPending ? "Adding..." : "Add Rider"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && (
            <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              Loading rider fleet...
            </p>
          )}

          {!isLoading && riders.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No riders found for this query.
            </p>
          )}

          {!isLoading &&
            riders.map((rider) => (
              <article
                key={rider.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {rider.full_name || "Unnamed rider"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {rider.phone_number || "—"} · {rider.email || "No email"}
                  </p>
                  <div className="flex items-center gap-3">
                    <AvailabilityBadge isOnline={Boolean(rider.is_active)} />
                    <span className="text-xs font-semibold text-[#4c84a4] dark:text-sky-400">
                      Active load: {rider.current_load ?? 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                      Completed: {rider.completed_orders ?? 0}
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                      Satisfaction: {Number(rider.satisfaction_rate ?? 0).toFixed(2)} / 5
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      patchMutation.mutate({
                        id: rider.id,
                        payload: { is_active: !rider.is_active },
                      })
                    }
                    className={[
                      "px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      rider.is_active
                        ? "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
                    ].join(" ")}
                  >
                    {rider.is_active ? "Set Offline" : "Set Online"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this rider profile?")) {
                        deleteMutation.mutate(rider.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}

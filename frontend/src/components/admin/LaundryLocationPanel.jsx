import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import {
  createLaundryLocation,
  engagementQueryKeys,
  fetchAdminLaundryLocations,
  toggleLaundryLocation,
} from "../../services/engagementApi";
import { useToast } from "./ToastContainer";

export default function LaundryLocationPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    hub_name: "",
    latitude: "",
    longitude: "",
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: engagementQueryKeys.adminLocations,
    queryFn: fetchAdminLaundryLocations,
  });

  const createMutation = useMutation({
    mutationFn: createLaundryLocation,
    onSuccess: () => {
      setForm({ hub_name: "", latitude: "", longitude: "" });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminLocations });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicLocations });
      toast.success("Laundry hub added.");
    },
    onError: () => toast.error("Could not add laundry hub."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleLaundryLocation(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.adminLocations });
      queryClient.invalidateQueries({ queryKey: engagementQueryKeys.publicLocations });
      toast.success("Hub visibility updated.");
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({
      hub_name: form.hub_name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 dark:bg-zinc-800 dark:border-zinc-700">
      <div className="flex items-center gap-2">
        <MapPin className="text-[#4c84a4]" size={20} />
        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
          Laundry hub locations
        </h2>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={form.hub_name}
          onChange={(e) => setForm((prev) => ({ ...prev, hub_name: e.target.value }))}
          placeholder="Hub name"
          required
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white dark:bg-zinc-900 dark:border-zinc-600"
        />
        <input
          value={form.latitude}
          onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
          type="number"
          step="0.000001"
          placeholder="Latitude"
          required
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white dark:bg-zinc-900 dark:border-zinc-600"
        />
        <input
          value={form.longitude}
          onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
          type="number"
          step="0.000001"
          placeholder="Longitude"
          required
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white dark:bg-zinc-900 dark:border-zinc-600"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#4c84a4] text-white text-sm font-bold disabled:opacity-60"
        >
          <Plus size={14} />
          Add hub
        </button>
      </form>

      <div className="rounded-xl border border-slate-100 dark:border-zinc-700 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-300">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Hub</th>
              <th className="text-left px-3 py-2 font-semibold">Latitude</th>
              <th className="text-left px-3 py-2 font-semibold">Longitude</th>
              <th className="text-left px-3 py-2 font-semibold">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  Loading locations...
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id}>
                  <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">{loc.hub_name}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{loc.latitude}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{loc.longitude}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: loc.id,
                          isActive: !loc.is_active,
                        })
                      }
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        loc.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {loc.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

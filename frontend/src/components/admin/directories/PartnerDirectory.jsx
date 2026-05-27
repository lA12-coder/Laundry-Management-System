import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import DirectoryTabs from "./DirectoryTabs";
import {
  createPartner,
  deletePartner,
  directoryQueryKeys,
  fetchPartnerDirectory,
  togglePartnerApproval,
} from "../../../services/directoryApi";
import { useToast } from "../ToastContainer";
import { normalizePhoneInput } from "../../../lib/phone";

function ApprovalSwitch({ checked, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex items-center gap-2 rounded-full px-2 py-1 border transition-colors disabled:opacity-60",
        checked
          ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700"
          : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
      ].join(" ")}
    >
      <span
        className={[
          "h-5 w-9 rounded-full p-0.5 flex items-center transition-colors",
          checked ? "bg-emerald-500" : "bg-gray-400",
        ].join(" ")}
      >
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow transform transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        {checked ? "Verified" : "Suspended"}
      </span>
    </button>
  );
}

export default function PartnerDirectory() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [newPartner, setNewPartner] = useState({
    business_name: "",
    hub_address: "",
    capacity_per_day: 0,
    owner_full_name: "",
    owner_email: "",
    owner_phone: "",
    password: "",
  });
  const search = useMemo(() => searchInput.trim(), [searchInput]);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: directoryQueryKeys.partners(search),
    queryFn: () => fetchPartnerDirectory(search),
    staleTime: 20_000,
  });

  const toggleMutation = useMutation({
    mutationFn: togglePartnerApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDirectory", "partners"] });
      toast.success("Partner updated", "Approval status changed.");
    },
    onError: () => toast.error("Update failed", "Could not toggle partner approval."),
  });

  const createMutation = useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      setNewPartner({
        business_name: "",
        hub_address: "",
        capacity_per_day: 0,
        owner_full_name: "",
        owner_email: "",
        owner_phone: "",
        password: "",
      });
      queryClient.invalidateQueries({ queryKey: ["adminDirectory", "partners"] });
      toast.success("Partner created", "New partner laundry has been added.");
    },
    onError: (error) => {
      const detail =
        error.response?.data?.detail ||
        (typeof error.response?.data === "object"
          ? Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join(" · ")
          : null) ||
        "Could not create partner.";
      toast.error("Create failed", detail);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDirectory", "partners"] });
      toast.success("Partner deleted", "Partner laundry removed.");
    },
    onError: () => toast.error("Delete failed", "Could not delete partner."),
  });

  const handleCreatePartner = (event) => {
    event.preventDefault();
    if (
      !newPartner.business_name ||
      !newPartner.owner_full_name ||
      !newPartner.owner_email ||
      !newPartner.owner_phone
    ) {
      toast.info("Business and owner contact fields are required.");
      return;
    }

    try {
      createMutation.mutate({
        ...newPartner,
        owner_phone: normalizePhoneInput(newPartner.owner_phone),
        capacity_per_day: Number(newPartner.capacity_per_day || 0),
      });
    } catch (error) {
      toast.error(error.message || "Use 09XXXXXXXX or +2519XXXXXXXX");
    }
  };

  return (
    <div className="space-y-6">
      <DirectoryTabs />

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="text-[#4c84a4] dark:text-sky-400" size={24} />
              Partner oversight
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Verify or suspend partner laundry shops from one control panel.
            </p>
          </div>
          <label className="relative w-full md:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search partners..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>

        <form onSubmit={handleCreatePartner} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            type="text"
            value={newPartner.business_name}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, business_name: event.target.value }))
            }
            placeholder="Business name"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={newPartner.owner_full_name}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, owner_full_name: event.target.value }))
            }
            placeholder="Owner full name"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="email"
            value={newPartner.owner_email}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, owner_email: event.target.value }))
            }
            placeholder="Owner email"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={newPartner.owner_phone}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, owner_phone: event.target.value }))
            }
            placeholder="Owner phone"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={newPartner.hub_address}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, hub_address: event.target.value }))
            }
            placeholder="Hub address (optional)"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="number"
            min={0}
            value={newPartner.capacity_per_day}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, capacity_per_day: event.target.value }))
            }
            placeholder="Capacity/day"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <input
            type="password"
            value={newPartner.password}
            onChange={(event) =>
              setNewPartner((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Owner password (optional)"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4c84a4] hover:bg-[#3e6f8b] text-white text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={15} />
            {createMutation.isPending ? "Creating..." : "Add Partner"}
          </button>
        </form>
      </section>

      {isLoading && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
          Loading partner directory...
        </div>
      )}

      {!isLoading && partners.length === 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
          No partner shops matched this search.
        </div>
      )}

      {!isLoading && partners.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <article
              key={partner.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {partner.business_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {partner.hub_address || "No hub address"}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  Load {partner.current_load ?? 0}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  Capacity/day:{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {partner.capacity_per_day ?? 0}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Registration status:{" "}
                  <span
                    className={
                      partner.is_approved
                        ? "font-semibold text-emerald-600 dark:text-emerald-300"
                        : "font-semibold text-gray-500 dark:text-gray-400"
                    }
                  >
                    {partner.is_approved ? "Verified" : "Pending/Suspended"}
                  </span>
                </p>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <ApprovalSwitch
                    checked={Boolean(partner.is_approved && partner.is_active)}
                    disabled={toggleMutation.isPending}
                    onToggle={() => toggleMutation.mutate(partner.id)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${partner.business_name}? This removes the partner and owner account.`,
                        )
                      ) {
                        deleteMutation.mutate(partner.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import DirectoryTabs from "./DirectoryTabs";
import {
  directoryQueryKeys,
  fetchCustomerDirectory,
} from "../../../services/directoryApi";

function AccountTypeBadge({ isGhost }) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
        isGhost
          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
          : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      ].join(" ")}
    >
      {isGhost ? "Ghost User" : "Registered"}
    </span>
  );
}

export default function CustomerDirectory() {
  const [searchInput, setSearchInput] = useState("");
  const search = useMemo(() => searchInput.trim(), [searchInput]);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: directoryQueryKeys.customers(search),
    queryFn: () => fetchCustomerDirectory(search),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <DirectoryTabs />

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="text-[#4c84a4] dark:text-sky-400" size={24} />
              Customer database
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unified directory for registered customers and ghost checkout users.
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
              placeholder="Search by name, phone, email..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Customer</th>
                <th className="text-left font-semibold px-4 py-3">Phone</th>
                <th className="text-left font-semibold px-4 py-3">Total Orders</th>
                <th className="text-left font-semibold px-4 py-3">Account Type</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading customer directory...
                  </td>
                </tr>
              )}

              {!isLoading && customers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No customers matched this search.
                  </td>
                </tr>
              )}

              {!isLoading &&
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{customer.full_name || "Unnamed customer"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email || "No email"}</p>
                    </td>
                    <td className="px-4 py-3">{customer.phone_number || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{customer.order_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <AccountTypeBadge isGhost={!customer.is_active} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

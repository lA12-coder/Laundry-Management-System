import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ShieldCheck } from "lucide-react";
import { fetchAuditLogsPage, auditQueryKeys } from "../../../services/auditApi";
import { OrderTableSkeleton } from "../orders/SkeletonCard";

const ACTION_LABELS = Object.freeze({
  override_status: "Status Overridden",
  reassign_rider: "Rider Reassigned",
  assign_partner: "Partner Assigned",
  partner_settlement: "Partner Settlement Cleared",
  partner_approval: "Partner Approved",
  partner_deactivation: "Partner Deactivated",
});

const ACTION_STYLES = Object.freeze({
  override_status:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  reassign_rider:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  assign_partner:
    "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  partner_settlement:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  partner_approval:
    "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  partner_deactivation:
    "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
});

function formatActionLabel(action, fallback) {
  return ACTION_LABELS[action] || fallback || String(action || "Unknown action");
}

function stringifyMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return "{}";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "{}";
  }
}

export default function AuditLogsWorkspace() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const queryParams = useMemo(() => {
    const params = {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
    };
    if (search.trim()) params.search = search.trim();
    return params;
  }, [pagination, search]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: auditQueryKeys.list(queryParams),
    queryFn: () => fetchAuditLogsPage(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const rows = data?.results || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  const canPrev = pagination.pageIndex > 0;
  const canNext = pagination.pageIndex + 1 < pageCount;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#4c84a4] dark:text-sky-300" />
              Security Audit Workspace
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Operational override trails, actor attribution, and metadata payloads.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => {
              setPagination((p) => ({ ...p, pageIndex: 0 }));
              setSearch(e.target.value);
            }}
            placeholder="Search by admin email, order id, old/new state..."
            className="w-full md:w-96 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#4c84a4]/30"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-900 text-slate-100">
              <tr className="text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Admin Operator Email</th>
                <th className="text-left px-4 py-3">Targeted Order ID</th>
                <th className="text-left px-4 py-3">Action Trigger Type</th>
                <th className="text-left px-4 py-3">Prior State Value</th>
                <th className="text-left px-4 py-3">New State Value</th>
                <th className="text-left px-4 py-3">Execution Time</th>
                <th className="text-left px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <OrderTableSkeleton rows={8} columns={7} />
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
                    {error?.message || "Failed to load action logs."}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No administrative action logs found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-slate-100 dark:border-zinc-800 text-sm text-slate-700 dark:text-slate-200 align-top"
                    >
                      <td className="px-4 py-3 font-semibold">{row.admin_email || "—"}</td>
                      <td className="px-4 py-3 font-mono">{row.order ? `#${row.order}` : "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-[11px] rounded-full border font-bold ${
                            ACTION_STYLES[row.action] ||
                            "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {formatActionLabel(row.action, row.action_display)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.previous_value || "—"}</td>
                      <td className="px-4 py-3">{row.new_value || "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4c84a4] dark:text-sky-300"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Hide JSON" : "View JSON"}
                        </button>
                        {isExpanded && (
                          <pre className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-x-auto max-w-[320px]">
                            {stringifyMetadata(row.metadata)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {totalCount.toLocaleString()} action logs
            {isFetching && !isLoading ? (
              <span className="ml-2 text-[#4c84a4]">Refreshing…</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))
              }
              className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[110px] text-center">
              Page {pagination.pageIndex + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
              }
              className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, Landmark, Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Permission } from "../../lib/rbac";
import { useToast } from "../../components/admin/ToastContainer";
import LedgerSummary from "../../components/admin/financial/LedgerSummary";
import FinancialLedger from "../../components/admin/financial/FinancialLedger";
import PartnerSettlement from "../../components/admin/financial/PartnerSettlement";
import {
  buildTransactionLogCsv,
  downloadCsvFile,
} from "../../lib/ledgerExport";
import { fetchTransactionLogsPage } from "../../services/financialApi";

async function fetchAllTransactionLogs(filterParams) {
  const collected = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const batch = await fetchTransactionLogsPage({
      ...filterParams,
      page,
      page_size: 100,
      ordering: "-created_at",
    });
    collected.push(...(batch.results ?? []));
    hasMore = Boolean(batch.next);
    page += 1;
  }
  return collected;
}

export default function FinancialManagement() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canExport = hasPermission(Permission.VIEW_FINANCIALS);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterParams = useMemo(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return params;
  }, [search, dateFrom, dateTo]);

  const exportMutation = useMutation({
    mutationFn: () => fetchAllTransactionLogs(filterParams),
    onSuccess: (rows) => {
      if (!rows.length) {
        toast.info("No transactions to export for the current filters.");
        return;
      }
      const csv = buildTransactionLogCsv(rows);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsvFile(csv, `fua-transaction-ledger-${stamp}.csv`);
      toast.success(`Exported ${rows.length} ledger row(s).`);
    },
    onError: () => {
      toast.error("Export failed. Please try again.");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Landmark className="text-[#4c84a4]" size={26} />
            Financial bookkeeping
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-2xl">
            Automated split ledger tied to{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">TransactionLog</code> — Fua
            commission from catalogue markup (Fua − partner − rider). Rider fee is set under
            System settings.
          </p>
        </div>

        {canExport && (
          <button
            type="button"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4c84a4] text-white text-sm font-medium hover:bg-[#3d6d88] disabled:opacity-60"
          >
            <Download size={18} />
            {exportMutation.isPending ? "Preparing CSV…" : "Export statement (CSV)"}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="search"
            placeholder="Order ID or partner name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          aria-label="To date"
        />
      </div>

      <LedgerSummary filterParams={filterParams} />
      <FinancialLedger filterParams={filterParams} />
      <PartnerSettlement />
    </div>
  );
}

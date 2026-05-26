import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { formatMoneyETB } from "../../../lib/money";
import { OrderTableSkeleton } from "../orders/SkeletonCard";
import {
  fetchTransactionLogsPage,
  financialQueryKeys,
} from "../../../services/financialApi";

const COLUMNS = 6;

function formatProcessedAt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Audit ledger — one row per TransactionLog settlement.
 */
export default function TransactionLogTable({ filterParams = {} }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filterParams]);

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      ordering: "-created_at",
      ...filterParams,
    }),
    [pagination, filterParams],
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: financialQueryKeys.transactions(queryParams),
    queryFn: () => fetchTransactionLogsPage(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const columns = useMemo(
    () => [
      {
        id: "order_id",
        header: "Order ID",
        accessorKey: "order_id",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
            #{getValue()}
          </span>
        ),
      },
      {
        id: "base_value",
        header: "Base value",
        accessorKey: "base_value",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatMoneyETB(getValue())}</span>
        ),
      },
      {
        id: "fualaundry_commission",
        header: "Fua commission",
        accessorKey: "fualaundry_commission",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-[#4c84a4] dark:text-sky-300">
            {formatMoneyETB(getValue())}
          </span>
        ),
      },
      {
        id: "rider_fee",
        header: "Operator fee",
        accessorKey: "rider_fee",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-amber-700 dark:text-amber-300">
            {formatMoneyETB(getValue())}
          </span>
        ),
      },
      {
        id: "partner_earning",
        header: "Net laundromat payout",
        accessorKey: "partner_earning",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatMoneyETB(getValue())}
          </span>
        ),
      },
      {
        id: "created_at",
        header: "Processing datetime",
        accessorKey: "created_at",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 dark:text-gray-300">{formatProcessedAt(getValue())}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const canNext = pagination.pageIndex + 1 < pageCount;
  const canPrev = pagination.pageIndex > 0;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction audit ledger</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automated splits recorded when orders enter washing or delivery
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
          {totalCount.toLocaleString()} record{totalCount !== 1 ? "s" : ""}
          {isFetching && !isLoading && (
            <span className="ml-2 text-[#4c84a4]">Refreshing…</span>
          )}
        </p>
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400 px-5 py-4">
          {error?.message || "Failed to load transaction logs."}
        </p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold uppercase">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <OrderTableSkeleton rows={8} columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No transaction logs yet. Settlements appear when orders reach washing.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-800 text-sm">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => table.previousPage()}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border",
            canPrev
              ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span className="text-gray-600 dark:text-gray-300 tabular-nums">
          Page {pagination.pageIndex + 1} of {pageCount}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => table.nextPage()}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border",
            canNext
              ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed",
          )}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

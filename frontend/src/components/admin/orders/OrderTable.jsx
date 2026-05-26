import { Fragment, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Ghost,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  ORDER_STATUS_STYLES,
  formatOrderStatus,
} from "../../../constants/orderStatus";
import { fetchAdminOrdersPage, orderQueryKeys } from "../../../services/ordersApi";
import { OrderTableSkeleton } from "./SkeletonCard";
import ClothItemsPanel from "./ClothItemsPanel";

const SORT_FIELD_MAP = {
  id: "id",
  created_at: "created_at",
  total_amount: "total_amount",
  status: "status",
};

function SortIcon({ column }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ChevronUp size={14} className="text-[#4c84a4]" />;
  if (sorted === "desc") return <ChevronDown size={14} className="text-[#4c84a4]" />;
  return <ChevronsUpDown size={14} className="text-gray-300" />;
}

/**
 * Server-driven order ledger (pagination, sort, filters via query params).
 */
export default function OrderTable({
  filters,
  selectedOrderId,
  onSelectOrder,
}) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [sorting, setSorting] = useState([{ id: "created_at", desc: true }]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters]);

  const queryParams = useMemo(() => {
    const sort = sorting[0];
    const field = SORT_FIELD_MAP[sort?.id] || "created_at";
    const ordering = `${sort?.desc ? "-" : ""}${field}`;
    return {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      ordering,
      ...filters,
    };
  }, [pagination, sorting, filters]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: orderQueryKeys.list(queryParams),
    queryFn: () => fetchAdminOrdersPage(queryParams),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  const orders = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const columns = useMemo(
    () => [
      {
        id: "expand",
        header: "",
        enableSorting: false,
        size: 40,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="p-1.5 text-gray-400 hover:text-[#4c84a4] hover:bg-blue-50 rounded-lg"
          >
            {row.getIsExpanded() ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ),
      },
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">#{row.original.id}</span>
            {row.original.urgency === "urgent" && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">
                Urgent
              </span>
            )}
          </div>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {o.customer_name || "Guest"}
                </p>
                {o.is_ghost_customer && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full border border-violet-200"
                    title="Ghost user — inactive account keyed by phone"
                  >
                    <Ghost size={10} />
                    Ghost
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {o.customer_phone || "—"}
              </p>
              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                {o.delivery_address}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "partner_name",
        header: "Partner",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600 font-medium">
            {getValue() || (
              <span className="text-gray-300 italic">Unassigned</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "rider_name",
        header: "Rider",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">
            {getValue() || <span className="text-gray-300 italic">None</span>}
          </span>
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span className="font-bold text-[#4c84a4]">
            ETB {parseFloat(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue();
          return (
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                ORDER_STATUS_STYLES[s] || "bg-gray-100 text-gray-700",
              )}
            >
              {formatOrderStatus(s)}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-500 font-medium">
            {getValue()
              ? new Date(getValue()).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: orders,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      expanded,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: false,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-gray-800 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIcon column={header.column} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <OrderTableSkeleton rows={pagination.pageSize} columns={columns.length} />
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-red-600 font-semibold text-sm">
                    Failed to load orders.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {error?.message || "Check API connection and permissions."}
                  </p>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={
                      selectedOrderId === row.original.id ? "selected" : undefined
                    }
                    className={cn(
                      "cursor-pointer",
                      selectedOrderId === row.original.id && "bg-blue-50/70",
                      isFetching && "opacity-80",
                    )}
                    onClick={() => onSelectOrder?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow key={`${row.id}-expanded`} className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="p-0">
                        <ClothItemsPanel items={row.original.cloth_items} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-gray-500 italic"
                >
                  No orders match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-semibold">
          {totalCount.toLocaleString()} order{totalCount !== 1 ? "s" : ""}
          {isFetching && !isLoading && (
            <span className="ml-2 text-[#4c84a4]">Refreshing…</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-gray-700 min-w-[100px] text-center">
            Page {pagination.pageIndex + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

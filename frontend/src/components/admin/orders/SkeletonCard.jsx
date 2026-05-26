import { cn } from "../../../lib/utils";

/** Single table row skeleton — height matches OrderTable data rows (py-3.5 ≈ 56px). */
export function SkeletonRow({ columns = 8 }) {
  return (
    <tr className="border-b border-gray-50 animate-pulse" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className={cn(
              "h-4 bg-gray-200 rounded-md",
              i === 0 ? "w-8" : i === 1 ? "w-24" : "w-4/5 max-w-[120px]",
            )}
          />
        </td>
      ))}
    </tr>
  );
}

/** Full table body skeleton during server fetch */
export function OrderTableSkeleton({ rows = 8, columns = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <SkeletonRow key={rowIdx} columns={columns} />
      ))}
    </>
  );
}

/** Card-style skeleton for side panels */
export function SkeletonCard({ lines = 3, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 space-y-3 animate-pulse",
        className,
      )}
      aria-hidden="true"
    >
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-100 rounded"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

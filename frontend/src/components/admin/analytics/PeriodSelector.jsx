import { cn } from "../../../lib/utils";
import { DASHBOARD_PERIODS } from "../../../constants/dashboardPeriods";

export default function PeriodSelector({ value, onChange, className }) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800",
        className,
      )}
      role="tablist"
      aria-label="Time range"
    >
      {DASHBOARD_PERIODS.map((period) => {
        const active = value === period.key;
        return (
          <button
            key={period.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(period.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
              active
                ? "bg-white dark:bg-gray-900 text-[#4c84a4] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
            )}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

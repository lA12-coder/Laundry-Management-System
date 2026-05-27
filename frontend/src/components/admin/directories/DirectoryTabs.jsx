import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../lib/utils";

const TABS = [
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/partners", label: "Partners" },
];

export default function DirectoryTabs() {
  const location = useLocation();

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2">
      <nav className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="Directory sections">
        {TABS.map((tab) => {
          const isActive = location.pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-semibold text-center transition-colors",
                isActive
                  ? "bg-[#4c84a4] text-white shadow-sm"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

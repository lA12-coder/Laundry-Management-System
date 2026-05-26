import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { ADMIN_NAV_ITEMS } from "../../config/adminNavigation";

function NavLink({ link, isSidebarOpen, currentPath, readOnly }) {
  const isActive = link.exact
    ? currentPath === link.href
    : currentPath.startsWith(link.href);
  const Icon = link.icon;

  return (
    <Link
      to={link.href}
      title={!isSidebarOpen ? link.name : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        isActive
          ? "bg-gradient-to-r from-[#4c84a4] to-cyan-600 text-white shadow-md shadow-blue-900/20 dark:from-cyan-700 dark:to-cyan-500"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-cyan-300",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
      )}
      <Icon size={19} className="flex-shrink-0" />
      {isSidebarOpen && (
        <span className="font-semibold text-sm whitespace-nowrap flex items-center gap-2">
          {link.name}
          {readOnly && (
            <span className="text-[9px] uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold dark:bg-zinc-700 dark:text-cyan-300">
              View
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

/**
 * Role-filtered sidebar — links the user cannot access are not mounted.
 *
 * @param {object} props
 * @param {boolean} props.isSidebarOpen
 */
export default function SidebarNavigation({ isSidebarOpen }) {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const visibleLinks = ADMIN_NAV_ITEMS.filter((item) =>
    hasPermission(item.permission),
  ).map((item) => ({
    ...item,
    readOnly:
      item.readOnlyPermission != null && !hasPermission(item.readOnlyPermission),
  }));

  return (
    <nav
      className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden"
      aria-label="Admin navigation"
    >
      {isSidebarOpen && (
        <p className="px-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Main Menu
        </p>
      )}
      {visibleLinks.map((link) => (
        <NavLink
          key={link.href}
          link={link}
          isSidebarOpen={isSidebarOpen}
          currentPath={location.pathname}
          readOnly={link.readOnly}
        />
      ))}
    </nav>
  );
}

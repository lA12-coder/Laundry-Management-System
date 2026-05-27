import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Bike,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { logout } from "../../redux/userSlice";
import api from "../../API/axios";
import { useAuth } from "../../hooks/useAuth";

const RIDER_THEME_KEY = "fua-rider-theme";

function getInitialRiderTheme() {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(RIDER_THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export default function RiderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialRiderTheme);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isDark = theme === "dark";

  const crumbs = useMemo(
    () =>
      location.pathname
        .split("/")
        .filter(Boolean)
        .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1)),
    [location.pathname],
  );

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await api.post("/accounts/logout/", { refresh });
      } catch {
        /* ignore */
      }
    }
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(RIDER_THEME_KEY, next);
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "R";

  const navItems = [
    { href: "/rider", label: "Delivery queue", icon: Package, exact: true },
    { href: "/rider/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn("min-h-screen transition-colors", isDark && "dark")}>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-zinc-900 dark:text-slate-100">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300",
            sidebarOpen ? "w-64" : "w-[76px]",
          )}
        >
          <div className="h-16 px-4 flex items-center border-b border-slate-100 dark:border-zinc-800">
            <Link to="/rider" className="flex items-center gap-3 overflow-hidden">
              <Bike className="text-emerald-500 flex-shrink-0" size={21} />
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-tight truncate">Rider Console</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Active queue only
                  </p>
                </div>
              )}
            </Link>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#4c84a4] text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800",
                    !sidebarOpen && "justify-center",
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={18} />
                  {sidebarOpen && item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                !sidebarOpen && "justify-center",
              )}
              title={!sidebarOpen ? "Sign out" : undefined}
            >
              <LogOut size={18} />
              {sidebarOpen && "Sign out"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="absolute -right-3.5 top-20 w-7 h-7 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-full flex items-center justify-center shadow-sm text-slate-400 dark:text-slate-300"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronRight
              size={14}
              className={cn("transition-transform", sidebarOpen && "rotate-180")}
            />
          </button>
        </aside>

        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-[76px]",
          )}
        >
          <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="sm:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                aria-label="Open rider menu"
              >
                <Menu size={18} />
              </button>
              <nav className="hidden sm:flex items-center text-sm min-w-0">
                {crumbs.map((crumb, index) => (
                  <span key={`${crumb}-${index}`} className="inline-flex items-center">
                    {index > 0 && (
                      <ChevronRight size={13} className="mx-1 text-slate-300 dark:text-zinc-600" />
                    )}
                    <span
                      className={cn(
                        index === crumbs.length - 1
                          ? "font-bold text-slate-900 dark:text-slate-100"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {crumb}
                    </span>
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-zinc-800"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
                {user?.full_name}
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            </div>
          </header>

          {menuOpen && (
            <div className="sm:hidden border-b border-slate-200 dark:border-zinc-800 px-4 py-3 flex gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold",
                    location.pathname === item.href
                      ? "bg-[#4c84a4] text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex-1 p-4 sm:p-6 bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

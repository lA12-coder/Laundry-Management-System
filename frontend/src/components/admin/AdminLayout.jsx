import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  ChevronRight,
  LogOut,
  ChevronLeft,
  Search,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../../lib/utils";
import { logout } from "../../redux/userSlice";
import { ToastProvider } from "./ToastContainer";
import api from "../../API/axios.js";
import SidebarNavigation from "./SidebarNavigation";
import { useAuth } from "../../hooks/useAuth";
import { ACCESS_LEVEL_LABELS } from "../../constants/roles";
import { Permission } from "../../lib/rbac";
import ThemeToggle from "../common/ThemeToggle";
import AdminThemeProvider from "./AdminThemeProvider";
import { useThemeStore } from "../../stores/useThemeStore";
import { fetchNotifications, notificationQueryKeys } from "../../services/notificationApi";
import toast from "react-hot-toast";

export default function AdminLayout() {
  const adminTheme = useThemeStore((s) => s.theme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const latestOrderAlertId = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, accessLevel, accessLabel, hasPermission } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await api.post("/accounts/logout/", { refresh });
      } catch {
        /* clear local session regardless */
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const { data: adminNotifications } = useQuery({
    queryKey: notificationQueryKeys.all,
    queryFn: () => fetchNotifications(20),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  useEffect(() => {
    const items = adminNotifications?.results || [];
    const newest = items.find(
      (n) =>
        !n.is_read &&
        n.notification_type === "system" &&
        n.metadata?.event === "order_created",
    );
    if (!newest) return;
    if (latestOrderAlertId.current === newest.id) return;
    latestOrderAlertId.current = newest.id;
    toast.success(newest.message || "New order placed.");
  }, [adminNotifications]);

  return (
    <AdminThemeProvider>
    <ToastProvider>
      <div
        className={cn(
          "admin-theme min-h-screen bg-slate-50 text-slate-950 flex transition-colors duration-300 dark:bg-zinc-900 dark:text-slate-100",
          adminTheme === "dark" && "dark",
        )}
      >
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out dark:bg-zinc-900 dark:border-zinc-800",
            isSidebarOpen ? "w-64" : "w-[72px]",
          )}
        >
          <div className="flex items-center h-16 px-4 border-b border-slate-100 dark:border-zinc-800">
            <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <span className="text-lg font-black italic text-slate-950 dark:text-slate-100 tracking-tight block truncate">
                    FuaLaundry
                  </span>
                  <span className="text-[10px] font-semibold text-[#4c84a4] dark:text-cyan-400 uppercase tracking-widest -mt-0.5 block">
                    {accessLabel || "Operations"}
                  </span>
                </div>
              )}
            </Link>
          </div>

          <SidebarNavigation isSidebarOpen={isSidebarOpen} />

          <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-1">
            {isSidebarOpen && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-950 dark:text-slate-100 truncate">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {ACCESS_LEVEL_LABELS[accessLevel] || user?.role}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "flex items-center w-full gap-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-sm font-semibold disabled:opacity-60 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400",
                !isSidebarOpen && "justify-center",
              )}
              title={!isSidebarOpen ? "Logout" : undefined}
            >
              <LogOut size={18} />
              {isSidebarOpen && (
                <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all dark:bg-zinc-800 dark:border-zinc-600 dark:text-slate-300 dark:hover:text-cyan-400"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </aside>

        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            isSidebarOpen ? "ml-64" : "ml-[72px]",
          )}
        >
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden flex-shrink-0 dark:hover:bg-zinc-800 dark:hover:text-cyan-400"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>

              <nav
                aria-label="Breadcrumb"
                className="hidden md:flex items-center text-sm min-w-0"
              >
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb}-${index}`}>
                    {index > 0 && (
                      <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-zinc-600 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "font-medium truncate",
                        index === breadcrumbs.length - 1
                          ? "text-slate-950 dark:text-slate-100 font-bold"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex items-center flex-1 max-w-md mx-2"
            >
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, customers…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-slate-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </form>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle variant="admin" />

              <button
                type="button"
                className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors dark:hover:bg-zinc-800 dark:hover:text-cyan-400"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-colors dark:hover:bg-zinc-800"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {initials}
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-slate-400 hidden sm:block transition-transform dark:text-zinc-500",
                      profileOpen && "rotate-180",
                    )}
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <div className="px-4 py-2 border-b border-slate-50 dark:border-zinc-700">
                      <p className="text-sm font-bold text-slate-950 dark:text-slate-100 truncate">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      <p className="text-[10px] font-bold text-[#4c84a4] dark:text-cyan-400 uppercase tracking-wider mt-1">
                        {accessLabel}
                      </p>
                    </div>
                    {hasPermission(Permission.MANAGE_SETTINGS) && (
                      <Link
                        to="/admin/settings"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-700"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                    )}
                    <Link
                      to="/"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-700"
                    >
                      <User size={16} />
                      Public site
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut size={16} />
                      {isLoggingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 sm:p-8 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
    </AdminThemeProvider>
  );
}

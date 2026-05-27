import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Building2, ChevronRight, LogOut, Store } from "lucide-react";
import { cn } from "../../lib/utils";
import { logout } from "../../redux/userSlice";
import api from "../../API/axios";
import { useAuth } from "../../hooks/useAuth";

export default function PartnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await api.post("/accounts/logout/", { refresh });
      } catch {
        // continue local logout
      }
    }
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "P";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="min-h-screen flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300",
            sidebarOpen ? "w-64" : "w-[76px]",
          )}
        >
          <div className="h-16 px-4 flex items-center border-b border-slate-100">
            <Link to="/partner" className="flex items-center gap-3 overflow-hidden">
              <Building2 className="text-[#4c84a4] flex-shrink-0" size={20} />
              {sidebarOpen && (
                <div>
                  <p className="text-sm font-black tracking-tight">Partner Panel</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Laundry operations
                  </p>
                </div>
              )}
            </Link>
          </div>

          <nav className="p-3 space-y-1">
            <Link
              to="/partner"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                location.pathname === "/partner"
                  ? "bg-[#4c84a4] text-white"
                  : "text-slate-500 hover:bg-slate-100",
                !sidebarOpen && "justify-center",
              )}
              title={!sidebarOpen ? "Overview" : undefined}
            >
              <Store size={18} />
              {sidebarOpen && "Overview"}
            </Link>
          </nav>

          <div className="mt-auto p-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50",
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
            className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronRight size={14} className={cn("transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </aside>

        <main
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-[76px]",
          )}
        >
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Partner workspace</p>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-slate-500">{user?.full_name}</span>
              <div className="w-8 h-8 rounded-full bg-[#4c84a4] text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

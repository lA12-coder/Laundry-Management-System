import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Bike, LogOut, Package, Menu } from "lucide-react";
import { cn } from "../../lib/utils";
import { logout } from "../../redux/userSlice";
import api from "../../API/axios";
import { useAuth } from "../../hooks/useAuth";
export default function RiderLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

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

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "R";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bike className="text-emerald-400" size={22} />
          <div>
            <p className="text-sm font-black tracking-tight">Rider Console</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Active queue only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">{user?.full_name}</span>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-white/10"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white"
          >
            <LogOut size={14} />
            Exit
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="sm:hidden border-b border-white/10 px-4 py-3 flex gap-4">
          <Link
            to="/rider"
            className={cn(
              "text-sm font-semibold",
              location.pathname === "/rider" ? "text-emerald-400" : "text-slate-400",
            )}
            onClick={() => setMenuOpen(false)}
          >
            Queue
          </Link>
          <button type="button" onClick={handleLogout} className="text-sm text-red-400 font-semibold">
            Sign out
          </button>
        </div>
      )}

      <nav className="hidden sm:flex gap-6 px-6 py-3 border-b border-white/10 text-sm font-semibold">
        <Link
          to="/rider"
          className={cn(
            "inline-flex items-center gap-2",
            location.pathname === "/rider" ? "text-emerald-400" : "text-slate-400 hover:text-white",
          )}
        >
          <Package size={16} />
          Delivery queue
        </Link>
      </nav>

      <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { assets } from '../../assets/assets';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  Menu,
  Bell,
  ChevronRight,
  LogOut,
  Bike,
  UserCheck,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { logout } from '../../redux/userSlice';
import { ToastProvider } from './ToastContainer';
import api from '../../API/axios.js';

const sidebarLinks = [
  { name: 'Dashboard',   href: '/admin',            icon: LayoutDashboard, exact: true  },
  { name: 'Orders',      href: '/admin/orders',      icon: ShoppingCart                  },
  { name: 'Customers',   href: '/admin/customers',   icon: UserCheck                     },
  { name: 'Riders',      href: '/admin/riders',      icon: Bike                          },
  { name: 'Partners',    href: '/admin/partners',    icon: Users                         },
  { name: 'Financials',  href: '/admin/financials',  icon: Wallet                        },
];

function NavLink({ link, isSidebarOpen, currentPath }) {
  const isActive = link.exact
    ? currentPath === link.href
    : currentPath.startsWith(link.href);
  const Icon = link.icon;

  return (
    <Link
      to={link.href}
      title={!isSidebarOpen ? link.name : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
        isActive
          ? 'bg-gradient-to-r from-[#4c84a4] to-[#5a9dc0] text-white shadow-md shadow-blue-900/20'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
      )}
      <Icon size={19} className="flex-shrink-0" />
      {isSidebarOpen && (
        <span className="font-semibold text-sm whitespace-nowrap">{link.name}</span>
      )}
    </Link>
  );
}

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const user = auth?.user || null;

  // RBAC Guard — only is_staff + role === 'admin'
  if (!auth?.isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      try { await api.post('/accounts/logout/', { refresh }); } catch (_) { /* ignore */ }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out',
            isSidebarOpen ? 'w-64' : 'w-[72px]'
          )}
        >
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-100">
            <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <span className="text-lg font-black italic text-gray-900 tracking-tight block truncate">
                    FuaLaundry
                  </span>
                  <span className="text-[10px] font-semibold text-[#4c84a4] uppercase tracking-widest -mt-0.5 block">
                    Admin Panel
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
            {isSidebarOpen && (
              <p className="px-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Main Menu
              </p>
            )}
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.href}
                link={link}
                isSidebarOpen={isSidebarOpen}
                currentPath={location.pathname}
              />
            ))}
          </nav>

          {/* User + Logout */}
          <div className="p-3 border-t border-gray-100 space-y-1">
            {isSidebarOpen && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                'flex items-center w-full gap-3 px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-sm font-semibold disabled:opacity-60',
                !isSidebarOpen && 'justify-center'
              )}
              title={!isSidebarOpen ? 'Logout' : undefined}
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>}
            </button>
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-screen transition-all duration-300',
            isSidebarOpen ? 'ml-64' : 'ml-[72px]'
          )}
        >
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <nav aria-label="breadcrumb" className="hidden sm:flex items-center text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb}-${index}`}>
                    {index > 0 && <ChevronRight size={14} className="mx-2 text-gray-300" />}
                    <span
                      className={cn(
                        'font-medium',
                        index === breadcrumbs.length - 1
                          ? 'text-gray-900 font-bold'
                          : 'text-gray-400'
                      )}
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors">
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initials}
              </div>
            </div>
          </header>

          {/* Page Area */}
          <div className="flex-1 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

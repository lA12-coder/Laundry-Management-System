import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Shirt
} from 'lucide-react';
import { cn } from '../../lib/utils';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Partners', href: '/admin/partners', icon: Users },
  { name: 'Financials', href: '/admin/financials', icon: Wallet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  
  // From Redux auth slice
  const auth = useSelector((state) => state.auth || state.user);
  const user = auth?.user || null;

  // RBAC: Redirect to home or login if not admin
  if (!auth?.isAuthenticated || user?.role !== 'admin') {
    // return <Navigate to="/login" replace />; // Uncomment in real implementation
  }

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((path) => path.charAt(0).toUpperCase() + path.slice(1));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
            <div className="bg-[#4c84a4] p-1.5 rounded-lg text-white flex-shrink-0">
              <Shirt size={24} />
            </div>
            {isSidebarOpen && (
              <span className="text-xl font-black italic text-gray-900 truncate">
                FuaAdmin
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group',
                  isActive
                    ? 'bg-[#4c84a4] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                title={!isSidebarOpen ? link.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="font-semibold whitespace-nowrap">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors",
              !isSidebarOpen && "justify-center px-0"
            )}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          isSidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center text-sm font-medium text-gray-500">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb}>
                  {index > 0 && <ChevronRight size={16} className="mx-2" />}
                  <span
                    className={cn(
                      index === breadcrumbs.length - 1 && 'text-gray-900 font-bold'
                    )}
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
               <span className="font-bold text-gray-600 text-sm">
                 {user?.full_name?.charAt(0).toUpperCase() || 'A'}
               </span>
            </div>
          </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Ghost, UserCheck, Phone, Mail, ShoppingBag, Filter } from 'lucide-react';
import { fetchAdminUsers } from '../../services/adminApi';
import { DataTable } from '../../components/admin/DataTable';
import { TableSkeleton } from '../../components/admin/Skeletons';
import { cn } from '../../lib/utils';

function GhostBadge({ isGhost }) {
  return isGhost ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
      <Ghost size={11} /> Ghost
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <UserCheck size={11} /> Active
    </span>
  );
}

const FILTER_TABS = [
  { label: 'All',       value: 'all'       },
  { label: 'Active',    value: 'active'    },
  { label: 'Ghost',     value: 'ghost'     },
];

export default function CustomerManagement() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  // Simple debounce
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers', 'customer', debouncedSearch],
    queryFn: () => fetchAdminUsers({ role: 'customer', search: debouncedSearch || undefined }),
    staleTime: 60_000,
  });

  const filtered = users.filter(u => {
    if (filterTab === 'active') return !u.is_ghost;
    if (filterTab === 'ghost') return u.is_ghost;
    return true;
  });

  const ghostCount = users.filter(u => u.is_ghost).length;
  const activeCount = users.filter(u => !u.is_ghost).length;

  const columns = [
    {
      header: 'Customer',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
              u.is_ghost ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-[#4c84a4]'
            )}>
              {u.is_ghost ? <Ghost size={16} /> : (u.full_name?.charAt(0) || '?').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{u.full_name || '—'}</p>
              <p className="text-xs text-gray-400">ID #{u.id}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Contact',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Phone size={12} className="text-gray-400" />
              {u.phone_number || '—'}
            </div>
            {!u.is_ghost && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Mail size={12} />
                {u.email}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      cell: ({ row }) => <GhostBadge isGhost={row.original.is_ghost} />,
    },
    {
      header: 'Orders',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
            <ShoppingBag size={13} className="text-gray-400" />
            {row.original.total_orders ?? 0}
          </div>
          {(row.original.active_orders ?? 0) > 0 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
              {row.original.active_orders} active
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.created_at
            ? new Date(row.original.created_at).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Unified view of registered and ghost (unregistered) customers.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserCheck size={16} className="text-[#4c84a4]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none">Active Users</p>
            <p className="text-lg font-black text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Ghost size={16} className="text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none">Ghost Users</p>
            <p className="text-lg font-black text-gray-900">{ghostCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/20 focus:border-[#4c84a4] outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                filterTab === tab.value
                  ? 'bg-[#4c84a4] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading
        ? <TableSkeleton rows={8} columns={5} />
        : <DataTable columns={columns} data={filtered} isLoading={false} />
      }
    </div>
  );
}

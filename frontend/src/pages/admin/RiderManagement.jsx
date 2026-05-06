import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Bike, Package, Trophy, Phone, Mail } from 'lucide-react';
import { fetchAdminUsers } from '../../services/adminApi';
import { TableSkeleton } from '../../components/admin/Skeletons';
import { cn } from '../../lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

function LoadBar({ current, max = 10 }) {
  const pct = Math.min(100, (current / Math.max(max, 1)) * 100);
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{current} active</span>
    </div>
  );
}

export default function RiderManagement() {
  const [search, setSearch] = useState('');

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['adminRiders'],
    queryFn: () => fetchAdminUsers({ role: 'rider' }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const sorted = [...riders].sort((a, b) => (b.total_orders ?? 0) - (a.total_orders ?? 0));

  const filtered = sorted.filter(r =>
    !search || r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const maxLoad = Math.max(...riders.map(r => r.active_orders ?? 0), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Oversight</h1>
          <p className="text-gray-500 text-sm mt-1">Leaderboard ranked by deliveries completed.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search riders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/20 focus:border-[#4c84a4] outline-none w-64 transition-all"
          />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Riders', value: riders.length, icon: Bike, color: 'bg-blue-100 text-[#4c84a4]' },
          { label: 'Currently Active', value: riders.filter(r => (r.active_orders ?? 0) > 0).length, icon: Package, color: 'bg-amber-100 text-amber-600' },
          { label: 'Avg. Orders / Rider', value: riders.length ? Math.round(riders.reduce((s, r) => s + (r.total_orders ?? 0), 0) / riders.length) : 0, icon: Trophy, color: 'bg-emerald-100 text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {isLoading ? <TableSkeleton rows={6} columns={5} /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-700">Leaderboard — Current Load</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((rider, idx) => {
              const medal = MEDALS[idx];
              return (
                <div key={rider.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Rank + Avatar */}
                  <div className="flex items-center gap-4">
                    <span className="w-7 text-center text-lg" title={`Rank #${idx + 1}`}>
                      {medal || <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(rider.full_name?.charAt(0) || 'R').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{rider.full_name || '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {rider.phone_number}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 hidden sm:flex">
                          <Mail size={10} /> {rider.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-black text-gray-900">{rider.total_orders ?? 0}</p>
                      <p className="text-xs text-gray-400">Total Orders</p>
                    </div>
                    <LoadBar current={rider.active_orders ?? 0} max={maxLoad} />
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full',
                      rider.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    )}>
                      {rider.is_active ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Bike size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No riders found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

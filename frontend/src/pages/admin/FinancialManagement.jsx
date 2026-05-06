import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, TrendingUp, Wallet, Receipt, Percent } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DataTable } from '../../components/admin/DataTable';
import { TableSkeleton, CardSkeleton } from '../../components/admin/Skeletons';
import { fetchAdminFinancials } from '../../services/adminApi';

const TIME_FILTERS = ['1D', '7D', '1M', '1Y'];

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function FinancialManagement() {
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('7D');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['adminFinancials'],
    queryFn: fetchAdminFinancials,
    staleTime: 60_000,
  });

  // Aggregates
  const totalRevenue     = transactions.reduce((s, t) => s + parseFloat(t.order?.total_amount || 0), 0);
  const partnerEarnings  = transactions.reduce((s, t) => s + parseFloat(t.partner_earning || 0), 0);
  const commission       = transactions.reduce((s, t) => s + parseFloat(t.fualaundry_commission || 0), 0);
  const riderFees        = Math.max(0, totalRevenue - partnerEarnings - commission);

  // Build chart data from transactions grouped by date
  const chartData = (() => {
    const days = timeFilter === '1D' ? 1 : timeFilter === '7D' ? 7 : timeFilter === '1M' ? 30 : 365;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = days <= 7
        ? d.toLocaleDateString([], { weekday: 'short' })
        : days <= 30
        ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        : d.toLocaleDateString([], { month: 'short' });
      if (!buckets[k]) buckets[k] = { name: k, revenue: 0, commission: 0 };
    }
    transactions.forEach(t => {
      const d = new Date(t.created_at);
      const k = days <= 7
        ? d.toLocaleDateString([], { weekday: 'short' })
        : days <= 30
        ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        : d.toLocaleDateString([], { month: 'short' });
      if (buckets[k]) {
        buckets[k].revenue += parseFloat(t.partner_earning || 0) + parseFloat(t.fualaundry_commission || 0);
        buckets[k].commission += parseFloat(t.fualaundry_commission || 0);
      }
    });
    return Object.values(buckets);
  })();

  const filtered = transactions.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(t.order_id).includes(s) ||
      (t.partner_name || '').toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      header: 'TXN ID',
      accessorKey: 'id',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-gray-500">
          #TXN-{String(getValue()).padStart(5, '0')}
        </span>
      ),
    },
    {
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-900">Order #{row.original.order_id}</span>
      ),
    },
    {
      header: 'Partner',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.partner_name || '—'}</span>
      ),
    },
    {
      header: 'Partner Earning',
      accessorKey: 'partner_earning',
      cell: ({ getValue }) => (
        <span className="text-sm font-bold text-emerald-600">
          ETB {parseFloat(getValue() || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Commission (15%)',
      accessorKey: 'fualaundry_commission',
      cell: ({ getValue }) => (
        <span className="text-sm font-bold text-purple-600">
          ETB {parseFloat(getValue() || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-400">
          {new Date(getValue()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue split, commissions, and partner payouts.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Revenue Split Cards */}
      {isLoading ? <CardSkeleton count={4} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={TrendingUp} label="Total Revenue"      value={`ETB ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}    color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <SummaryCard icon={Wallet}    label="Partner Earnings"    value={`ETB ${partnerEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}  color="bg-gradient-to-br from-emerald-500 to-green-600" />
          <SummaryCard icon={Receipt}   label="Rider Fees (Est.)"   value={`ETB ${riderFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}        color="bg-gradient-to-br from-amber-500 to-orange-500" />
          <SummaryCard icon={Percent}   label="FuaLaundry 15% Commission" value={`ETB ${commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-gray-900">Revenue over Time</h3>
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            {TIME_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === f ? 'bg-[#4c84a4] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4c84a4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4c84a4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v/1000}k`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4c84a4" strokeWidth={2} fill="url(#finGrad)" dot={false} />
              <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" strokeWidth={2} fill="url(#commGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by order or partner…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/20 focus:border-[#4c84a4] outline-none transition-all"
          />
        </div>
        {isLoading ? <TableSkeleton rows={6} columns={6} /> : <DataTable columns={columns} data={filtered} isLoading={false} />}
      </div>
    </div>
  );
}

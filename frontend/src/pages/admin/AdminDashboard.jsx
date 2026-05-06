import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Users, ShoppingBag, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical, Percent, Bike
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line,
} from 'recharts';
import { fetchDashboardMetrics, fetchAdminFinancials, fetchAdminOrders } from '../../services/adminApi';
import { CardSkeleton, ChartSkeleton, Skeleton } from '../../components/admin/Skeletons';
import { cn } from '../../lib/utils';

// ─── Color palette ────────────────────────────────────────────────────────────
const BRAND = '#4c84a4';
const PALETTE = ['#4c84a4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const TIME_FILTERS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, trendValue, color, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn('p-3 rounded-xl', color)}>
          <Icon size={22} className="text-white" />
        </div>
        <button className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100">
          <MoreVertical size={18} />
        </button>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {trend && (
        <div className="flex items-center mt-3">
          {trend === 'up'
            ? <ArrowUpRight size={15} className="text-emerald-500 mr-1" />
            : <ArrowDownRight size={15} className="text-red-500 mr-1" />
          }
          <span className={cn('text-xs font-bold', trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>
            {trendValue}
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

// ─── Revenue Split Card ───────────────────────────────────────────────────────
function RevenueSplitCard({ totalRevenue, transactions }) {
  const partnerEarnings = transactions.reduce((s, t) => s + parseFloat(t.partner_earning || 0), 0);
  const commission = transactions.reduce((s, t) => s + parseFloat(t.fualaundry_commission || 0), 0);
  const riderFees = totalRevenue - partnerEarnings - commission;

  const splits = [
    { label: 'Total Revenue',       value: totalRevenue,    color: 'bg-blue-500',    pct: 100  },
    { label: 'Partner Earnings',    value: partnerEarnings, color: 'bg-emerald-500', pct: totalRevenue ? (partnerEarnings / totalRevenue * 100) : 0 },
    { label: 'Rider Fees',          value: Math.max(0, riderFees), color: 'bg-amber-500', pct: totalRevenue ? (Math.max(0, riderFees) / totalRevenue * 100) : 0 },
    { label: 'FuaLaundry (15%)',    value: commission,      color: 'bg-purple-500',  pct: totalRevenue ? (commission / totalRevenue * 100) : 0 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-5">Revenue Split</h3>
      <div className="space-y-4">
        {splits.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
              <span className="text-sm font-bold text-gray-900">
                ETB {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', item.color)}
                style={{ width: `${Math.min(100, item.pct)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{item.pct.toFixed(1)}% of total</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: ETB {Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── Generate mock trend data (replace with real API data when ready) ─────────
function buildTrendData(orders, days) {
  const now = new Date();
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = days <= 1
      ? d.toLocaleTimeString([], { hour: '2-digit' })
      : days <= 7
      ? d.toLocaleDateString([], { weekday: 'short' })
      : days <= 30
      ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      : d.toLocaleDateString([], { month: 'short' });
    if (!buckets[key]) buckets[key] = { name: key, revenue: 0, orders: 0 };
  }

  (orders || []).forEach((order) => {
    const d = new Date(order.created_at);
    let key;
    if (days <= 1) key = d.toLocaleTimeString([], { hour: '2-digit' });
    else if (days <= 7) key = d.toLocaleDateString([], { weekday: 'short' });
    else if (days <= 30) key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    else key = d.toLocaleDateString([], { month: 'short' });

    if (buckets[key]) {
      buckets[key].revenue += parseFloat(order.total_amount || 0);
      buckets[key].orders += 1;
    }
  });

  return Object.values(buckets);
}

// ─── Status breakdown for mini pie-like display ───────────────────────────────
const STATUS_CONFIG = {
  pending:       { label: 'Pending',          color: '#f59e0b' },
  picked_up:     { label: 'Picked Up',        color: '#3b82f6' },
  washing:       { label: 'Washing',          color: '#8b5cf6' },
  ready:         { label: 'Ready',            color: '#10b981' },
  out_for_delivery: { label: 'Out for Delivery', color: '#06b6d4' },
  delivered:     { label: 'Delivered',        color: '#22c55e' },
  cancelled:     { label: 'Cancelled',        color: '#ef4444' },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState(7);

  const {
    data: metricsData,
    isLoading: metricsLoading,
  } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 60_000,
  });

  const {
    data: transactions = [],
    isLoading: txLoading,
  } = useQuery({
    queryKey: ['adminFinancials'],
    queryFn: fetchAdminFinancials,
    staleTime: 60_000,
  });

  const {
    data: allOrders = [],
    isLoading: ordersLoading,
  } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => fetchAdminOrders(),
    staleTime: 30_000,
  });

  const isLoading = metricsLoading || txLoading || ordersLoading;

  const { metrics = {}, top_partners = [] } = metricsData || {};
  const trendData = buildTrendData(allOrders, timeFilter);

  // Status breakdown from orders
  const statusCounts = (allOrders || []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_CONFIG[status]?.label || status,
    value: count,
    fill: STATUS_CONFIG[status]?.color || '#94a3b8',
  }));

  const totalRevenue = parseFloat(metrics.total_revenue || 0);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time laundry operations overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTimeFilter(tf.days)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                timeFilter === tf.days
                  ? 'bg-[#4c84a4] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`ETB ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Orders"
          value={metrics.total_orders?.toLocaleString() || '0'}
          icon={ShoppingBag}
          trend="up"
          trendValue="+8.2%"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Orders"
          value={metrics.active_orders?.toLocaleString() || '0'}
          icon={Clock}
          subtitle={`${metrics.pending_pickups || 0} pending pickups`}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="Net Profit"
          value={`ETB ${parseFloat(metrics.total_profit || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="+14.1%"
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
      </div>

      {/* ── Revenue Trend + Revenue Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Area Chart — Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Orders & revenue over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={BRAND}
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: BRAND }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Split */}
        <RevenueSplitCard totalRevenue={totalRevenue} transactions={transactions} />
      </div>

      {/* ── Order Volume (Bar) + Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Bar Chart — Order Volume */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-6">Order Volume</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="orders" name="Orders" radius={[6, 6, 0, 0]} barSize={24} fill={BRAND} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Order Status</h3>
          <div className="space-y-3">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }} />
                  <span className="text-sm text-gray-600">{s.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{s.value}</span>
              </div>
            ))}
            {statusData.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Partner Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-900">Partner Leaderboard</h3>
            <span className="text-xs font-semibold text-[#4c84a4] bg-blue-50 px-2.5 py-1 rounded-full">
              Top {top_partners.length}
            </span>
          </div>
          <div className="space-y-4">
            {top_partners.map((partner, index) => (
              <div key={index} className="flex items-center justify-between group hover:bg-gray-50 -mx-3 px-3 py-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                  >
                    {(partner.business_name || '?').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{partner.business_name}</h4>
                    <p className="text-xs text-gray-400">Cap: {partner.capacity_per_day}/day</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{partner.completed_count} orders</p>
                  <p className="text-xs text-emerald-500 font-semibold">
                    ETB {parseFloat(partner.total_earnings || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {top_partners.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No partner data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders Quick View */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
          </div>
          <div className="space-y-3">
            {(allOrders || []).slice(0, 6).map((order) => {
              const cfg = STATUS_CONFIG[order.status] || {};
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                      #{order.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {order.customer_name || 'Guest'}
                      </p>
                      <p className="text-xs text-gray-400">{order.partner_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ETB {parseFloat(order.total_amount || 0).toLocaleString()}
                    </p>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
                    >
                      {cfg.label || order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

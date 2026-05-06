import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable';
import { TableSkeleton } from '../../components/admin/Skeletons';
import { useToast } from '../../components/admin/ToastContainer';
import { fetchAdminPartners, approvePartner, deactivatePartner } from '../../services/adminApi';
import { cn } from '../../lib/utils';

export default function PartnerManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: fetchAdminPartners,
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminPartners'] });

  const approveMutation = useMutation({
    mutationFn: approvePartner,
    onSuccess: (_, id) => { invalidate(); toast.success('Partner Approved', 'Partner is now active.'); },
    onError: () => toast.error('Failed', 'Could not approve partner.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivatePartner,
    onSuccess: () => { invalidate(); toast.warning('Partner Deactivated'); },
    onError: () => toast.error('Failed', 'Could not deactivate partner.'),
  });

  const filtered = partners.filter(p =>
    !search || p.business_name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Partner',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4c84a4] to-[#2d5f7e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {p.business_name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{p.business_name}</p>
              <p className="text-xs text-gray-400">ID #{p.id}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Owner',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="text-sm text-gray-600">
            {p.owner_email || '—'}
          </div>
        );
      }
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const p = row.original;
        if (!p.is_approved) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Pending Approval
            </span>
          );
        }
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
            p.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
          )}>
            {p.is_active ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      header: 'Capacity',
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-700">
          {row.original.capacity_per_day}
          <span className="text-xs font-normal text-gray-400 ml-1">orders/day</span>
        </span>
      )
    },
    {
      header: 'Current Load',
      cell: ({ row }) => {
        const load = row.original.current_load ?? 0;
        const cap = row.original.capacity_per_day || 1;
        const pct = Math.min(100, (load / cap) * 100);
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
              <div
                className={cn('h-full rounded-full transition-all', pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{load}</span>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const p = row.original;
        const isApproving = approveMutation.isPending && approveMutation.variables === p.id;
        const isDeactivating = deactivateMutation.isPending && deactivateMutation.variables === p.id;

        return (
          <div className="flex items-center gap-2">
            {!p.is_approved && (
              <button
                onClick={() => approveMutation.mutate(p.id)}
                disabled={isApproving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {isApproving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Approve
              </button>
            )}
            {p.is_active && p.is_approved && (
              <button
                onClick={() => deactivateMutation.mutate(p.id)}
                disabled={isDeactivating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {isDeactivating ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Deactivate
              </button>
            )}
            {!p.is_active && p.is_approved && (
              <button
                onClick={() => approveMutation.mutate(p.id)}
                disabled={isApproving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#4c84a4] rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
              >
                {isApproving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Reactivate
              </button>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-500 text-sm mt-1">Approve, activate, and monitor laundry partners.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4c84a4] text-white font-bold rounded-xl hover:bg-[#3a6680] transition-colors shadow-md shadow-blue-900/10 text-sm">
          <Plus size={16} /> Add Partner
        </button>
      </div>

      {/* Pending approval banner */}
      {partners.filter(p => !p.is_approved).length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-sm font-semibold text-amber-800">
            {partners.filter(p => !p.is_approved).length} partner(s) awaiting approval
          </p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search partners…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4c84a4]/20 focus:border-[#4c84a4] outline-none transition-all"
        />
      </div>

      {isLoading
        ? <TableSkeleton rows={6} columns={6} />
        : <DataTable columns={columns} data={filtered} isLoading={false} />
      }
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, ShieldAlert, CheckCircle2, Truck, Loader2 } from 'lucide-react';
import { fetchAdminOrders, overrideOrderStatus } from '../../services/adminApi';
import { DataTable } from './DataTable';
import { cn } from '../../lib/utils';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  picked_up: 'bg-blue-100 text-blue-800 border-blue-200',
  washing: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
};

export default function OrderManagementTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch Orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['adminOrders', statusFilter],
    queryFn: () => fetchAdminOrders(statusFilter ? { status: statusFilter } : undefined),
    refetchInterval: 30000, // auto-refresh every 30s
  });

  // Mutation for overriding status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      overrideOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => <span className="font-black italic text-gray-900">#{row.original.id}</span>,
    },
    {
      accessorKey: 'customer_email',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.original.customer_email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'partner_name',
      header: 'Laundry Partner',
      cell: ({ row }) => (
        <span className="font-medium text-gray-600">
          {row.original.partner_name || <span className="text-gray-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-bold text-[#4c84a4]">
          {row.original.total_amount} Birr
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
              STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200'
            )}
          >
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        
        return (
          <div className="relative group inline-block">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal size={20} className="text-gray-500" />
            </button>
            
            {/* Simple dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-2 space-y-1">
                <p className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Update Status
                </p>
                {['pending', 'picked_up', 'washing', 'delivered'].map((s) => (
                  <button
                    key={s}
                    disabled={statusMutation.isPending && statusMutation.variables?.id === order.id}
                    onClick={() => statusMutation.mutate({ id: order.id, status: s })}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                      order.status === s 
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                        : "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                    )}
                  >
                    {statusMutation.isPending && statusMutation.variables?.id === order.id && statusMutation.variables?.status === s ? (
                       <Loader2 size={16} className="animate-spin" />
                    ) : (
                      s === 'delivered' ? <CheckCircle2 size={16} /> : 
                      s === 'picked_up' ? <Truck size={16} /> : 
                      <ShieldAlert size={16} />
                    )}
                    <span className="capitalize">{s.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic text-gray-900 tracking-tight">Order Management</h2>
          <p className="text-gray-500 font-medium mt-1">
            Monitor and manage all laundry orders across partners.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4c84a4]"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="picked_up">Picked Up</option>
            <option value="washing">Washing</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Table Component */}
      <DataTable 
        columns={columns} 
        data={orders || []} 
        isLoading={isLoading} 
      />
    </div>
  );
}

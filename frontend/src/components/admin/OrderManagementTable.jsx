import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal, ChevronDown, ChevronRight, Plus, Edit,
  Trash2, X, PlusCircle, MinusCircle, Loader2, UserCheck, Package
} from 'lucide-react';
import {
  fetchAdminOrders, overrideOrderStatus, reassignRider,
  createAdminOrder, updateAdminOrder, deleteAdminOrder,
  fetchFormOptions, fetchPriceList
} from '../../services/adminApi';
import { DataTable } from './DataTable';
import { TableSkeleton } from './Skeletons';
import { useToast } from './ToastContainer';
import { cn } from '../../lib/utils';

const STATUS_COLORS = {
  pending:          'bg-amber-100 text-amber-800 border-amber-200',
  picked_up:        'bg-blue-100 text-blue-800 border-blue-200',
  washing:          'bg-purple-100 text-purple-800 border-purple-200',
  ready:            'bg-cyan-100 text-cyan-800 border-cyan-200',
  out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered:        'bg-green-100 text-green-800 border-green-200',
  cancelled:        'bg-red-100 text-red-800 border-red-200',
};
const ALL_STATUSES = ['pending','picked_up','washing','ready','out_for_delivery','delivered','cancelled'];

// ── ClothItems Expanded Row ────────────────────────────────────────────────
function ClothItemsRow({ items }) {
  if (!items?.length) return (
    <div className="px-6 py-4 bg-gray-50 text-sm text-gray-400 italic">No cloth items recorded.</div>
  );
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-blue-50/60 to-transparent border-t border-blue-100">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Package size={13} /> Cloth Items
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
            <p className="text-sm font-bold text-gray-900 truncate">{item.cloth_name}</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.size} · ×{item.quantity}</p>
            <p className="text-xs font-semibold text-[#4c84a4] mt-1">
              ETB {parseFloat(item.line_total || item.fua_price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reassign Rider Dropdown ────────────────────────────────────────────────
function ReassignDropdown({ orderId, currentRiderId, riders, onReassign, isPending }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4c84a4]/10 hover:bg-[#4c84a4]/20 text-[#4c84a4] rounded-lg text-xs font-bold transition-colors"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
        Reassign
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
              Select Rider
            </p>
            <div className="max-h-48 overflow-y-auto py-1">
              {(riders || []).map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onReassign(r.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors',
                    r.id === currentRiderId ? 'font-bold text-[#4c84a4]' : 'text-gray-700'
                  )}
                >
                  {r.full_name || r.email}
                  {r.id === currentRiderId && ' ✓'}
                </button>
              ))}
              {!riders?.length && (
                <p className="px-3 py-3 text-xs text-gray-400 text-center">No riders available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Order Form Modal ───────────────────────────────────────────────────────
function OrderModal({ mode, order, formOptions, priceList, onClose, onCreate, onUpdate, isSubmitting }) {
  const [form, setForm] = useState(() => mode === 'edit' && order ? {
    customer_name: order.customer_name || '',
    customer_phone: '',
    delivery_address: order.delivery_address || '',
    urgency: order.urgency || 'regular',
    partner: order.partner || '',
    rider: order.rider || '',
    status: order.status || 'pending',
    items: [],
  } : {
    customer_name: '', customer_phone: '', delivery_address: '',
    urgency: 'regular', partner: '', rider: '', status: 'pending', items: [],
  });

  const [selectedItems, setSelectedItems] = useState({});

  const changeQty = (id, delta) => setSelectedItems(prev => {
    const q = Math.max(0, (prev[id] || 0) + delta);
    return { ...prev, [id]: q };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const itemsPayload = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ price_list_entry_id: parseInt(id), quantity }));

    if (mode === 'create') {
      onCreate({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        delivery_address: form.delivery_address,
        urgency: form.urgency,
        partner: form.partner ? parseInt(form.partner) : null,
        rider: form.rider ? parseInt(form.rider) : null,
        items: itemsPayload,
      });
    } else {
      onUpdate({
        delivery_address: form.delivery_address,
        urgency: form.urgency,
        partner: form.partner ? parseInt(form.partner) : null,
        rider: form.rider ? parseInt(form.rider) : null,
        status: form.status,
      });
    }
  };

  const field = (label, children, required) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4c84a4]/30 focus:border-[#4c84a4] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Create New Order' : `Edit Order #${order?.id}`}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form id="order-form" onSubmit={handleSubmit} className="space-y-5">
            {mode === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                {field('Customer Name', <input className={inputCls} value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="Full name" required />, true)}
                {field('Phone Number', <input className={inputCls} value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} placeholder="+254..." required />, true)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {field('Delivery Address', <input className={inputCls} value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} placeholder="Address" required />, true)}
              {field('Urgency', (
                <select className={inputCls} value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}>
                  <option value="regular">Regular</option>
                  <option value="urgent">Urgent</option>
                </select>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field('Partner', (
                <select className={inputCls} value={form.partner} onChange={e => setForm({...form, partner: e.target.value})}>
                  <option value="">Unassigned</option>
                  {formOptions?.partners?.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
                </select>
              ))}
              {field('Rider', (
                <select className={inputCls} value={form.rider} onChange={e => setForm({...form, rider: e.target.value})}>
                  <option value="">Auto-assign</option>
                  {formOptions?.riders?.map(r => <option key={r.id} value={r.id}>{r.full_name || r.email}</option>)}
                </select>
              ))}
            </div>

            {mode === 'edit' && field('Status', (
              <select className={inputCls} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            ))}

            {mode === 'create' && priceList?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Cloth Items</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {priceList.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.cloth_name}</p>
                        <p className="text-xs text-gray-400 capitalize">{item.size} · ETB {item.fua_price}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button type="button" onClick={() => changeQty(item.id, -1)} className="text-red-400 hover:text-red-600">
                          <MinusCircle size={18} />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-gray-800">{selectedItems[item.id] || 0}</span>
                        <button type="button" onClick={() => changeQty(item.id, 1)} className="text-emerald-500 hover:text-emerald-700">
                          <PlusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button
            type="submit" form="order-form" disabled={isSubmitting}
            className="px-5 py-2 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OrderManagementTable() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminOrders', statusFilter],
    queryFn: () => fetchAdminOrders(statusFilter ? { status: statusFilter } : undefined),
    refetchInterval: 30_000,
  });

  const { data: formOptions } = useQuery({
    queryKey: ['formOptions'],
    queryFn: fetchFormOptions,
    staleTime: 300_000,
  });

  const { data: priceList = [] } = useQuery({
    queryKey: ['priceList'],
    queryFn: fetchPriceList,
    staleTime: 300_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminOrders'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => overrideOrderStatus(id, status),
    onSuccess: (_, { status }) => { invalidate(); toast.success('Status Updated', `Order moved to ${status.replace(/_/g,' ')}`); },
    onError: () => toast.error('Failed', 'Could not update status.'),
  });

  const riderMutation = useMutation({
    mutationFn: ({ id, riderId }) => reassignRider(id, riderId),
    onSuccess: () => { invalidate(); toast.success('Rider Reassigned', 'Rider updated successfully.'); },
    onError: () => toast.error('Failed', 'Could not reassign rider.'),
  });

  const createMutation = useMutation({
    mutationFn: createAdminOrder,
    onSuccess: () => { invalidate(); setIsModalOpen(false); toast.success('Order Created', 'New order added.'); },
    onError: (err) => toast.error('Create Failed', err.response?.data?.error || err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminOrder(id, data),
    onSuccess: () => { invalidate(); setIsModalOpen(false); toast.success('Order Updated', 'Changes saved.'); },
    onError: (err) => toast.error('Update Failed', err.response?.data?.error || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminOrder,
    onSuccess: () => { invalidate(); toast.success('Order Deleted'); },
    onError: () => toast.error('Delete Failed', 'Could not delete order.'),
  });

  const toggleRow = (id) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openModal = (mode, order = null) => { setModalMode(mode); setSelectedOrder(order); setIsModalOpen(true); };

  const columns = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <button onClick={() => toggleRow(row.original.id)} className="p-1.5 text-gray-400 hover:text-[#4c84a4] hover:bg-blue-50 rounded-lg transition-colors">
          {expandedRows.has(row.original.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Order',
      cell: ({ row }) => (
        <div>
          <span className="font-black text-gray-900">#{row.original.id}</span>
          {row.original.urgency === 'urgent' && (
            <span className="ml-1.5 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Urgent</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{row.original.customer_name || 'Guest'}</p>
          <p className="text-xs text-gray-400">{row.original.delivery_address}</p>
        </div>
      ),
    },
    {
      accessorKey: 'partner_name',
      header: 'Partner',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 font-medium">
          {row.original.partner_name || <span className="text-gray-300 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      accessorKey: 'rider_name',
      header: 'Rider',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {row.original.rider_name || <span className="text-gray-300 italic">None</span>}
          </span>
          <ReassignDropdown
            orderId={row.original.id}
            currentRiderId={row.original.rider}
            riders={formOptions?.riders}
            onReassign={(riderId) => riderMutation.mutate({ id: row.original.id, riderId })}
            isPending={riderMutation.isPending && riderMutation.variables?.id === row.original.id}
          />
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-bold text-[#4c84a4]">ETB {parseFloat(row.original.total_amount || 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', STATUS_COLORS[s] || 'bg-gray-100 text-gray-700 border-gray-200')}>
            {s.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="relative group inline-block">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal size={18} className="text-gray-400" />
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-2 space-y-0.5">
                <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change Status</p>
                {ALL_STATUSES.filter(s => s !== order.status).map(s => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate({ id: order.id, status: s })}
                    className="w-full text-left px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 capitalize transition-colors"
                  >
                    → {s.replace(/_/g, ' ')}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => openModal('edit', order)} className="w-full text-left px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition-colors">
                  <Edit size={13} /> Edit
                </button>
                <button
                  onClick={() => { if (window.confirm('Delete this order?')) deleteMutation.mutate(order.id); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor the full laundry lifecycle.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4c84a4]/30"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#4c84a4] hover:bg-[#3a6680] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-900/10"
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={7} columns={7} /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable columns={columns} data={orders} isLoading={false} />
          {/* Expandable rows */}
          {orders.map(order => expandedRows.has(order.id) && (
            <ClothItemsRow key={`items-${order.id}`} items={order.cloth_items} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <OrderModal
          mode={modalMode}
          order={selectedOrder}
          formOptions={formOptions}
          priceList={priceList}
          onClose={() => setIsModalOpen(false)}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(data) => updateMutation.mutate({ id: selectedOrder.id, data })}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

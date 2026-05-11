import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, Truck, CheckCircle, BellRing, Settings, Loader2, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from "../../API/axios";
import { Link } from 'react-router-dom';
import { useNotificationStore } from "../../stores/notificationStore";

// The linear progression of order statuses
const STATUS_STEPS = [
  { id: 'pending',          label: 'Pending',      icon: Clock },
  { id: 'picked_up',        label: 'Picked Up',    icon: Package },
  { id: 'washing',          label: 'Washing',      icon: Loader2 },
  { id: 'ready',            label: 'Ready',        icon: CheckCircle },
  { id: 'out_for_delivery', label: 'Delivering',   icon: Truck },
  { id: 'delivered',        label: 'Delivered',    icon: CheckCircle },
];

function GhostBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-[#4c84a4] rounded-2xl p-5 sm:p-6 mb-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BellRing size={20} className="text-amber-300" /> Claim Your Account
        </h3>
        <p className="text-sm text-blue-100 mt-1 max-w-lg">
          You are currently viewing a guest session. Set a password and verify your phone number to save your order history and manage your preferences.
        </p>
      </div>
      <Link 
        to="/profile" 
        className="px-5 py-2.5 bg-white text-blue-600 hover:bg-gray-50 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap transition-colors"
      >
        Complete Profile
      </Link>
    </div>
  );
}

function OrderStepper({ status }) {
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === status);
  // Fallback for cancelled orders
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-bold">
        This order has been cancelled.
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Background Line (Mobile vertical, Desktop horizontal) */}
      <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-100 sm:hidden" />
      <div className="hidden sm:block absolute top-10 left-10 right-10 h-0.5 bg-gray-100" />
      
      {/* Progress Line */}
      <div 
        className="absolute left-6 top-10 w-0.5 bg-[#4c84a4] sm:hidden transition-all duration-500 ease-out" 
        style={{ height: `${Math.max(0, currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
      />
      <div 
        className="hidden sm:block absolute top-10 left-10 h-0.5 bg-[#4c84a4] transition-all duration-500 ease-out" 
        style={{ width: `${Math.max(0, currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 relative z-10">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;
          
          let circleColor = 'bg-white border-2 border-gray-200 text-gray-300';
          if (isCompleted) circleColor = 'bg-[#4c84a4] border-2 border-[#4c84a4] text-white';
          if (isCurrent) circleColor = 'bg-white border-2 border-[#4c84a4] text-[#4c84a4] ring-4 ring-blue-50';
          
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${circleColor}`}>
                {isCurrent && step.id === 'washing' ? (
                  <Icon size={20} className="animate-spin" />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <div className="sm:text-center">
                <p className={`text-sm font-bold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-[#4c84a4] font-medium hidden sm:block mt-0.5">In Progress</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderTracker() {
  const { user } = useSelector(state => state.auth);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  // Track previous statuses for toast notifications
  const [prevStatuses, setPrevStatuses] = useState({});

  const fetchCustomerOrders = async () => {
    const { data } = await api.get('/orders/');
    return data;
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['customerOrders'],
    queryFn: fetchCustomerOrders,
    staleTime: 30_000, // 30 seconds fresh
    refetchInterval: 30_000, // Poll every 30s
  });

  // Effect to trigger toasts when status changes
  useEffect(() => {
    if (!orders.length) return;
    
    const newStatuses = {};
    let changesDetected = false;
    
    orders.forEach(order => {
      newStatuses[order.id] = order.status;
      const prevStatus = prevStatuses[order.id];
      
      if (prevStatus && prevStatus !== order.status) {
        changesDetected = true;
        const msg = `Order #${order.id} is now ${order.status.replace(/_/g, ' ')}!`;
        toast.success(msg, {
          icon: '👕',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
        addNotification({
          title: 'Order Update',
          message: msg,
          type: 'status_change',
          orderId: order.id
        });
      }
    });

    if (changesDetected || Object.keys(prevStatuses).length === 0) {
      setPrevStatuses(newStatuses);
    }
  }, [orders, prevStatuses, addNotification]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Ghost User Banner */}
      {user && !user.is_active && <GhostBanner />}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Live Track</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor your active laundry orders.</p>
        </div>
        <Link to="/checkout" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#4c84a4] text-white font-bold rounded-xl hover:bg-[#3a6680] transition-colors text-sm shadow-md">
          <Package size={16} /> New Order
        </Link>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-[#4c84a4] rounded-full flex items-center justify-center mx-auto mb-5">
            <Package size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Your laundry basket is empty. Place an order to see the magic happen!</p>
          <Link to="/checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4c84a4] text-white font-bold rounded-xl hover:bg-[#3a6680] transition-all shadow-md shadow-blue-900/20">
            Place New Order <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm font-bold text-[#4c84a4] tracking-widest uppercase mb-1">Order #{order.id}</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {order.cloth_items?.length || 0} Items • ETB {parseFloat(order.total_amount || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">Placed on</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(order.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <OrderStepper status={order.status} />

              <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-900">{order.delivery_address}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Estimated Delivery</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.urgency === 'urgent' ? '24 Hours' : '2-3 Days'}
                    </p>
                  </div>
                  {order.urgency === 'urgent' && (
                    <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-full">Urgent</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini Past Orders Section */}
      {pastOrders.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Past Orders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastOrders.slice(0, 3).map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <p className="text-sm font-bold text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mobile Floating Action Button */}
      <Link to="/checkout" className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#4c84a4] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/30 z-40">
        <Package size={24} />
      </Link>
    </div>
  );
}

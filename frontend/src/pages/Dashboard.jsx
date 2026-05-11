import React from "react";
import { Link } from "react-router-dom";
import OrderTracker from "../components/customer/OrderTracker.jsx";
import { useNotificationStore } from "../stores/notificationStore";

const Dashboard = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-14 pt-28">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900">Customer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Track active orders and manage your account settings.</p>
          <div className="mt-4 flex gap-3">
            <Link to="/profile" className="rounded-xl bg-[#4c84a4] px-4 py-2 text-sm font-bold text-white">
              Profile Settings
            </Link>
            <Link to="/item-list" className="rounded-xl border border-[#4c84a4] px-4 py-2 text-sm font-bold text-[#4c84a4]">
              Add Items to Cart
            </Link>
          </div>
        </div>

        <OrderTracker />

        <div className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900">Latest Alerts</h3>
          <div className="mt-3 space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-bold text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

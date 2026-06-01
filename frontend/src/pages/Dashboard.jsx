import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import OrderTracker from "../components/customer/OrderTracker.jsx";
import { useNotificationStore } from "../stores/notificationStore";
import {
  fetchMySubscriptions,
  subscriptionQueryKeys,
} from "../services/subscriptionApi";

function SubscriptionStatusCard() {
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: subscriptionQueryKeys.customer,
    queryFn: fetchMySubscriptions,
    staleTime: 30_000,
  });

  const latest = subscriptions[0];
  const status = latest?.status || "none";
  const statusLabel = status.replaceAll("_", " ");

  let daysRemaining = null;
  if (latest?.end_date) {
    const end = new Date(latest.end_date);
    const now = new Date();
    const diff = end.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const badgeStyles = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
    expired: "bg-slate-100 text-slate-700 border-slate-200",
    disabled: "bg-red-100 text-red-700 border-red-200",
    none: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">My Subscription</h3>

      {isLoading ? (
        <p className="mt-3 text-sm text-gray-500">Loading subscription status...</p>
      ) : !latest ? (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            You do not have a subscription yet.
          </p>
          <Link
            to="/"
            className="inline-block mt-3 rounded-xl bg-[#4c84a4] px-4 py-2 text-sm font-bold text-white"
          >
            Choose a plan
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Plan:</span> {latest.plan_name}
          </p>
          <span
            className={`inline-flex px-2 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${badgeStyles[status] || badgeStyles.none}`}
          >
            {statusLabel}
          </span>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Start:</span> {latest.start_date || "Pending"}
            </p>
            <p>
              <span className="font-semibold">End:</span> {latest.end_date || "Pending"}
            </p>
            {status === "active" && daysRemaining != null && (
              <p>
                <span className="font-semibold">Days remaining:</span>{" "}
                {Math.max(0, daysRemaining)}
              </p>
            )}
          </div>
          {status !== "active" && (
            <Link
              to="/"
              className="inline-block rounded-xl border border-[#4c84a4] px-4 py-2 text-sm font-bold text-[#4c84a4]"
            >
              Renew / Upgrade
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

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

        <SubscriptionStatusCard />

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

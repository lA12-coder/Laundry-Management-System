import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchNotifications,
  markNotificationsRead,
  notificationQueryKeys,
} from "../../services/notificationApi";
import { useNotificationStore } from "../../stores/notificationStore";

/**
 * Real-time notification hub with server-backed unread counts and localized status copy.
 */
export default function NotificationCenter({ scrolled = false, enabled = true }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const latestSystemToastId = useRef(null);
  const queryClient = useQueryClient();
  const markAllAsReadLocal = useNotificationStore((s) => s.markAllAsRead);
  const syncFromServer = useNotificationStore((s) => s.syncFromServer);

  const { data, isLoading } = useQuery({
    queryKey: notificationQueryKeys.all,
    queryFn: () => fetchNotifications(50),
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const notifications = data?.results ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const visibleNotifications = notifications.filter((n) => !n.is_read);

  useEffect(() => {
    if (!data?.results) return;
    syncFromServer(
      data.results.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        read: n.is_read,
        date: n.created_at,
        type: n.notification_type,
        orderId: n.order_id,
      })),
      data.unread_count,
    );
  }, [data, syncFromServer]);

  useEffect(() => {
    if (!notifications.length) return;
    const newest = notifications.find(
      (n) =>
        !n.is_read &&
        n.notification_type === "system" &&
        n.metadata?.event === "order_created",
    );
    if (!newest) return;
    if (latestSystemToastId.current === newest.id) return;
    latestSystemToastId.current = newest.id;
    toast.success(newest.message || "New order received.");
  }, [notifications]);

  const markReadMutation = useMutation({
    mutationFn: (ids) => markNotificationsRead(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });
      const previous = queryClient.getQueryData(notificationQueryKeys.all);
      const currentResults = previous?.results ?? [];
      const currentUnread =
        typeof previous?.unread_count === "number"
          ? previous.unread_count
          : currentResults.filter((n) => !n.is_read).length;

      if (!ids || ids.length === 0) {
        markAllAsReadLocal();
        queryClient.setQueryData(notificationQueryKeys.all, {
          results: [],
          unread_count: 0,
        });
      } else {
        const nextResults = currentResults.map((n) =>
          ids.includes(n.id) ? { ...n, is_read: true } : n,
        );
        const nextUnread = Math.max(
          0,
          currentUnread - ids.filter((id) => currentResults.some((n) => n.id === id && !n.is_read)).length,
        );
        queryClient.setQueryData(notificationQueryKeys.all, {
          results: nextResults,
          unread_count: nextUnread,
        });
      }

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      markAllAsReadLocal();
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationQueryKeys.all, context.previous);
      }
    },
  });

  useEffect(() => {
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (!enabled) return null;

  const bellColor = scrolled ? "#4081a2" : "#FD9837";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-full p-2"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={20} color={bellColor} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[10000] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-zinc-950/50">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-950 dark:text-slate-100">Notifications</p>
            <button
              type="button"
              className="text-xs font-bold text-[#4c84a4] dark:text-cyan-400 disabled:opacity-40"
              disabled={unreadCount === 0 || markReadMutation.isPending}
              onClick={() => markReadMutation.mutate([])}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {isLoading ? (
              <p className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">Loading alerts…</p>
            ) : visibleNotifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">No notifications yet</p>
            ) : (
              visibleNotifications.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`w-full rounded-xl p-2 text-left transition ${
                    "bg-cyan-50/80 ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:ring-cyan-800"
                  }`}
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate([n.id]);
                  }}
                >
                  <p className="text-xs font-bold text-slate-950 dark:text-slate-100">{n.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

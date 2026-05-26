import api from "../API/axios";

export const notificationQueryKeys = {
  all: ["notifications"],
};

export async function fetchNotifications(limit = 50) {
  const { data } = await api.get("/accounts/notifications/", { params: { limit } });
  const payload = data?.data ?? data;
  return {
    results: payload?.results ?? [],
    unread_count: payload?.unread_count ?? 0,
  };
}

export async function markNotificationsRead(ids = []) {
  const { data } = await api.post("/accounts/notifications/mark-read/", { ids });
  return data?.data ?? data;
}

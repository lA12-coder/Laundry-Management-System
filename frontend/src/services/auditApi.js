import api from "../API/axios";

export const auditQueryKeys = {
  all: ["auditLogs"],
  list: (params) => ["auditLogs", "list", params],
};

function unwrapList(data) {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  if (data?.results) return data;
  if (data?.data?.results) return data.data;
  return { count: 0, next: null, previous: null, results: [] };
}

export async function fetchAuditLogsPage(params = {}) {
  const { data } = await api.get("/admin/audit-logs/", { params });
  return unwrapList(data);
}

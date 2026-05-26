import api from "../API/axios";

export const financialQueryKeys = {
  all: ["financial"],
  summary: (params) => ["financial", "summary", params],
  transactions: (params) => ["financial", "transactions", params],
};

function unwrapList(data) {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  if (data?.results) return data;
  return { count: 0, next: null, previous: null, results: [] };
}

export async function fetchLedgerSummary(params = {}) {
  const { data } = await api.get("/admin/transactions/summary/", { params });
  return data?.data ?? data;
}

export async function fetchTransactionLogsPage(params = {}) {
  const { data } = await api.get("/admin/transactions/", { params });
  return unwrapList(data);
}

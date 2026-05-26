import api from "../API/axios";

export const ghostAccountQueryKeys = {
  me: ["auth", "me"],
};

export async function startGhostSession(phone_number) {
  const { data } = await api.post("/accounts/ghost-session/", { phone_number });
  return data?.data ?? data;
}

export async function claimAccount(payload) {
  const { data } = await api.post("/accounts/claim-account/", payload);
  return data?.data ?? data;
}

/** Normalize checkout-style phone input to E.164. */
export function normalizePhoneInput(raw) {
  const value = (raw || "").trim();
  if (!value) return "";
  if (value.startsWith("+")) return value;
  if (value.startsWith("0")) return `+251${value.slice(1)}`;
  return `+251${value}`;
}

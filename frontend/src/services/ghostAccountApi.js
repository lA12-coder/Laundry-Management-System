import api from "../API/axios";
import { normalizePhoneInput as normalizePhone } from "../lib/phone";

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
  return normalizePhone(raw);
}

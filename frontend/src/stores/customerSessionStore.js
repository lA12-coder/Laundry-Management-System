import { create } from "zustand";

export const useCustomerSessionStore = create((set) => ({
  isGhostUser: false,
  setGhostUser: (isGhostUser) => set({ isGhostUser }),
}));

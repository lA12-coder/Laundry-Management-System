import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  preferences: {
    sms: true,
    email: true,
    marketing: false,
  },
  
  addNotification: (notification) => set((state) => ({
    notifications: [{ id: Date.now(), read: false, date: new Date(), ...notification }, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  updatePreferences: (newPrefs) => set((state) => ({
    preferences: { ...state.preferences, ...newPrefs }
  })),
}));

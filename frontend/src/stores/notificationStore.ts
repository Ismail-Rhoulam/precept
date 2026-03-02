import { create } from "zustand"

interface NotificationState {
  unreadCount: number
  showPanel: boolean
  setUnreadCount: (count: number) => void
  setShowPanel: (show: boolean) => void
  togglePanel: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  showPanel: false,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setShowPanel: (show) => set({ showPanel: show }),
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
}))

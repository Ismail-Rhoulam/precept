import { api } from "./client"
import type { Notification } from "@/types/notification"

export const notificationsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<{ results: Notification[]; total: number; page: number; page_size: number }>(
      "/comm/notifications/",
      { params: params as Record<string, string | number | boolean | undefined> },
    ),

  markRead: (id: number) =>
    api.post<Notification>(`/comm/notifications/${id}/mark-read`),

  markAllRead: () =>
    api.post<{ count: number }>("/comm/notifications/mark-all-read"),

  unreadCount: () =>
    api.get<{ count: number }>("/comm/notifications/unread-count"),
}

"use client"

import {
  AtSign,
  CheckSquare,
  UserPlus,
  MessageCircle,
  Bell,
  Check,
  Inbox,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications"
import type { Notification } from "@/types/notification"
import { cn } from "@/lib/utils"

interface NotificationPanelProps {
  onClose: () => void
}

function notificationIcon(type: Notification["type"]) {
  switch (type) {
    case "Mention":
      return <AtSign className="h-4 w-4 text-blue-600" />
    case "Task":
      return <CheckSquare className="h-4 w-4 text-purple-600" />
    case "Assignment":
      return <UserPlus className="h-4 w-4 text-green-600" />
    case "WhatsApp":
      return <MessageCircle className="h-4 w-4 text-emerald-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

function notificationIconBg(type: Notification["type"]) {
  switch (type) {
    case "Mention":
      return "bg-blue-100"
    case "Task":
      return "bg-purple-100"
    case "Assignment":
      return "bg-green-100"
    case "WhatsApp":
      return "bg-emerald-100"
    default:
      return "bg-gray-100"
  }
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data: notifications, isLoading } = useNotifications({ page: 1, page_size: 20 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const items: Notification[] = Array.isArray(notifications) ? notifications : []

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markRead.mutate(notification.id)
    }
    // Navigate to entity if available
    if (notification.reference_doctype && notification.reference_id) {
      const doctype = notification.reference_doctype.toLowerCase()
      const path = `/${doctype}s/${notification.reference_id}`
      window.location.href = path
    }
    onClose()
  }

  function handleMarkAllRead() {
    markAllRead.mutate()
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {markAllRead.isPending ? "Marking..." : "Mark all read"}
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          items.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
                !notification.read && "bg-blue-50/50"
              )}
            >
              {/* Unread indicator */}
              <div className="flex-shrink-0 mt-1.5 relative">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    notificationIconBg(notification.type)
                  )}
                >
                  {notificationIcon(notification.type)}
                </div>
                {!notification.read && (
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    notification.read ? "text-gray-600" : "text-gray-900 font-medium"
                  )}
                >
                  {notification.notification_text}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  {notification.from_user_name && (
                    <span className="text-gray-500">
                      {notification.from_user_name}
                    </span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <button
            onClick={() => {
              window.location.href = "/notifications"
              onClose()
            }}
            className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all
          </button>
        </div>
      )}
    </div>
  )
}

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
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

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
      return <Bell className="h-4 w-4 text-muted-foreground" />
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
    <Card className="absolute right-0 mt-2 w-96 z-50 overflow-hidden shadow-xl">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <Button
          variant="link"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="h-auto p-0 text-xs"
        >
          {markAllRead.isPending ? "Marking..." : "Mark all read"}
        </Button>
      </CardHeader>

      <Separator />

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          items.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
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
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    notification.read ? "text-muted-foreground" : "text-foreground font-medium"
                  )}
                >
                  {notification.notification_text}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/60">
                  {notification.from_user_name && (
                    <span className="text-muted-foreground">
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
        <>
          <Separator />
          <CardFooter className="px-4 py-3 justify-center">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => {
                window.location.href = "/notifications"
                onClose()
              }}
            >
              See all
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

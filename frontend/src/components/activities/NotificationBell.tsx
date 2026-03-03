"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { useUnreadCount } from "@/hooks/useNotifications"
import { NotificationPanel } from "./NotificationPanel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: unreadCount } = useUnreadCount()

  const count = typeof unreadCount === "number" ? unreadCount : 0

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white border-2 border-background hover:bg-red-500">
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Button>

      {isOpen && <NotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  )
}

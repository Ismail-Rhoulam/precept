"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null // Don't show anything when connected

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-medium">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline</span>
    </div>
  )
}

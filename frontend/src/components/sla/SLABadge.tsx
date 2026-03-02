"use client"

import { cn } from "@/lib/utils"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"

interface SLABadgeProps {
  slaStatus: string
  responseBy: string | null
}

export function SLABadge({ slaStatus, responseBy }: SLABadgeProps) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; icon: React.ReactNode }
  > = {
    "First Response Due": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: <Clock className="h-3 w-3" />,
    },
    Fulfilled: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    Failed: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const config = statusConfig[slaStatus] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: <Clock className="h-3 w-3" />,
  }

  const responseByDate = responseBy ? new Date(responseBy) : null
  const isOverdue = responseByDate ? isPast(responseByDate) : false

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
          config.bg,
          config.text
        )}
        title={
          responseByDate
            ? `Response by: ${format(responseByDate, "MMM d, yyyy 'at' h:mm a")}`
            : undefined
        }
      >
        {config.icon}
        {slaStatus || "N/A"}
      </div>
      {responseByDate && slaStatus === "First Response Due" && (
        <span
          className={cn(
            "text-xs",
            isOverdue ? "text-red-600 font-medium" : "text-gray-500"
          )}
        >
          {isOverdue
            ? `Overdue by ${formatDistanceToNow(responseByDate)}`
            : `Due ${formatDistanceToNow(responseByDate, { addSuffix: true })}`}
        </span>
      )}
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface SLABadgeProps {
  slaStatus: string
  responseBy: string | null
}

export function SLABadge({ slaStatus, responseBy }: SLABadgeProps) {
  const statusConfig: Record<
    string,
    { className: string; icon: React.ReactNode }
  > = {
    "First Response Due": {
      className: "bg-yellow-100 text-yellow-800 border-transparent",
      icon: <Clock className="h-3 w-3" />,
    },
    Fulfilled: {
      className: "bg-green-100 text-green-800 border-transparent",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    Failed: {
      className: "bg-red-100 text-red-800 border-transparent",
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const config = statusConfig[slaStatus] || {
    className: "bg-muted text-muted-foreground border-transparent",
    icon: <Clock className="h-3 w-3" />,
  }

  const responseByDate = responseBy ? new Date(responseBy) : null
  const isOverdue = responseByDate ? isPast(responseByDate) : false

  return (
    <div className="inline-flex flex-col gap-1">
      <Badge
        variant="secondary"
        className={cn("gap-1.5", config.className)}
        title={
          responseByDate
            ? `Response by: ${format(responseByDate, "MMM d, yyyy 'at' h:mm a")}`
            : undefined
        }
      >
        {config.icon}
        {slaStatus || "N/A"}
      </Badge>
      {responseByDate && slaStatus === "First Response Due" && (
        <span
          className={cn(
            "text-xs",
            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
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

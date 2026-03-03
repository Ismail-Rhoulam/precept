"use client"

import { useQuery } from "@tanstack/react-query"
import { dealsApi } from "@/lib/api/deals"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || ""
  const l = lastName?.charAt(0)?.toUpperCase() || ""
  return f + l || "?"
}

function formatCurrency(value: number, currency: string): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function RecentDeals() {
  const { data, isLoading } = useQuery({
    queryKey: ["deals", "recent", { page: 1, page_size: 5, ordering: "-created_at" }],
    queryFn: () => dealsApi.list({ page: 1, page_size: 5, ordering: "-created_at" }),
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[160px]" />
            </div>
            <Skeleton className="ml-auto h-4 w-[80px]" />
          </div>
        ))}
      </div>
    )
  }

  const deals = data?.results || []

  if (deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        No recent deals
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {deals.map((deal) => (
        <div key={deal.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {getInitials(deal.first_name, deal.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {[deal.first_name, deal.last_name].filter(Boolean).join(" ") || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              {deal.email || deal.organization_name || deal.reference_id}
            </p>
          </div>
          <div className="ml-auto font-medium">
            {formatCurrency(deal.deal_value, deal.currency)}
          </div>
        </div>
      ))}
    </div>
  )
}

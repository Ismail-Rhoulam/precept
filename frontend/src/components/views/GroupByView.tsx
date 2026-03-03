"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Layers, Hash } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

interface GroupByGroup {
  value: string | null
  count: number
}

interface GroupByViewProps {
  groups: GroupByGroup[]
  results: any[]
  entityType: string
  groupByField: string
  onItemClick: (item: any) => void
  isLoading?: boolean
  total: number
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

function SkeletonGroup() {
  return (
    <Card>
      <CardHeader className="p-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </CardContent>
    </Card>
  )
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function GroupByView({
  groups,
  results,
  entityType,
  groupByField,
  onItemClick,
  isLoading,
  total,
}: GroupByViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = useCallback((groupValue: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupValue)) {
        next.delete(groupValue)
      } else {
        next.add(groupValue)
      }
      return next
    })
  }, [])

  // Group results by the groupByField value
  const getItemsForGroup = useCallback(
    (groupValue: string | null): any[] => {
      return results.filter((item) => {
        const itemValue = item[groupByField]
        if (groupValue === null) {
          return itemValue === null || itemValue === undefined || itemValue === ""
        }
        return String(itemValue) === String(groupValue)
      })
    },
    [results, groupByField]
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton summary bar */}
        <Card className="bg-muted/50">
          <CardContent className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
        <SkeletonGroup />
        <SkeletonGroup />
        <SkeletonGroup />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No groups to display
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          There are no {entityType} to group by {formatFieldLabel(groupByField)}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span className="font-medium">{total}</span>
            <span>{entityType} total</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span className="font-medium">{groups.length}</span>
            <span>groups by {formatFieldLabel(groupByField)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      {groups.map((group) => {
        const groupKey = group.value ?? "__null__"
        const displayValue = group.value || "Not Set"
        const isCollapsed = collapsedGroups.has(groupKey)
        const items = getItemsForGroup(group.value)

        return (
          <Card key={groupKey} className="overflow-hidden">
            {/* Group Header */}
            <CardHeader className="p-0">
              <Button
                variant="ghost"
                onClick={() => toggleGroup(groupKey)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-muted/50 hover:bg-muted rounded-none justify-start h-auto font-normal"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    group.value ? "text-foreground" : "text-muted-foreground italic"
                  )}
                >
                  {displayValue}
                </span>
                <Badge variant="secondary" className="rounded-full">
                  {group.count}
                </Badge>
              </Button>
            </CardHeader>

            {/* Group Items */}
            {!isCollapsed && (
              <CardContent className="p-0 divide-y divide-border">
                {items.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-muted-foreground text-center">
                    No items in this group
                  </div>
                ) : (
                  items.map((item) => (
                    <GroupByRow
                      key={item.id}
                      item={item}
                      entityType={entityType}
                      onClick={() => onItemClick(item)}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function GroupByRow({
  item,
  entityType,
  onClick,
}: {
  item: any
  entityType: string
  onClick: () => void
}) {
  const name =
    [item.first_name, item.last_name].filter(Boolean).join(" ") ||
    item.lead_name ||
    item.organization_name ||
    "Unnamed"

  const createdDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block">{name}</span>
        {item.email && (
          <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
        )}
      </div>

      {/* Organization */}
      <div className="hidden sm:block w-32 text-sm text-muted-foreground truncate">
        {item.organization || item.organization_name || "--"}
      </div>

      {/* Status */}
      {item.status && (
        <Badge
          className="rounded-full text-xs font-medium flex-shrink-0 border-transparent"
          style={{
            backgroundColor: item.status_color ? `${item.status_color}20` : "#e5e7eb",
            color: item.status_color || "#374151",
          }}
        >
          {item.status}
        </Badge>
      )}

      {/* Deal Value (for deals) */}
      {entityType === "deals" && item.deal_value !== undefined && (
        <div className="hidden md:block w-28 text-sm font-medium text-foreground text-right">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: item.currency || "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(item.deal_value)}
        </div>
      )}

      {/* Owner */}
      <div className="hidden lg:block w-28 text-xs text-muted-foreground truncate">
        {item.lead_owner_name || item.deal_owner_name || item.lead_owner_email || item.deal_owner_email || "--"}
      </div>

      {/* Date */}
      {createdDate && (
        <div className="hidden lg:block w-24 text-xs text-muted-foreground text-right">
          {createdDate}
        </div>
      )}
    </div>
  )
}

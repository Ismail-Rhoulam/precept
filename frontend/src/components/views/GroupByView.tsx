"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Layers, Hash } from "lucide-react"

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
    <div className="flex items-center gap-4 px-6 py-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-40" />
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-4 bg-gray-200 rounded w-20" />
    </div>
  )
}

function SkeletonGroup() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-5 bg-gray-200 rounded-full w-10" />
      </div>
      <div className="divide-y divide-gray-100">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
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
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <SkeletonGroup />
        <SkeletonGroup />
        <SkeletonGroup />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No groups to display
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          There are no {entityType} to group by {formatFieldLabel(groupByField)}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Hash className="w-4 h-4" />
          <span className="font-medium">{total}</span>
          <span>{entityType} total</span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Layers className="w-4 h-4" />
          <span className="font-medium">{groups.length}</span>
          <span>groups by {formatFieldLabel(groupByField)}</span>
        </div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const groupKey = group.value ?? "__null__"
        const displayValue = group.value || "Not Set"
        const isCollapsed = collapsedGroups.has(groupKey)
        const items = getItemsForGroup(group.value)

        return (
          <div
            key={groupKey}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupKey)}
              className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  group.value ? "text-gray-900" : "text-gray-400 italic"
                )}
              >
                {displayValue}
              </span>
              <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                {group.count}
              </span>
            </button>

            {/* Group Items */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-gray-400 text-center">
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
              </div>
            )}
          </div>
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
      className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate block">{name}</span>
        {item.email && (
          <span className="text-xs text-gray-500 truncate block">{item.email}</span>
        )}
      </div>

      {/* Organization */}
      <div className="hidden sm:block w-32 text-sm text-gray-600 truncate">
        {item.organization || item.organization_name || "--"}
      </div>

      {/* Status */}
      {item.status && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
          style={{
            backgroundColor: item.status_color ? `${item.status_color}20` : "#e5e7eb",
            color: item.status_color || "#374151",
          }}
        >
          {item.status}
        </span>
      )}

      {/* Deal Value (for deals) */}
      {entityType === "deals" && item.deal_value !== undefined && (
        <div className="hidden md:block w-28 text-sm font-medium text-gray-900 text-right">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: item.currency || "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(item.deal_value)}
        </div>
      )}

      {/* Owner */}
      <div className="hidden lg:block w-28 text-xs text-gray-500 truncate">
        {item.lead_owner_name || item.deal_owner_name || item.lead_owner_email || item.deal_owner_email || "--"}
      </div>

      {/* Date */}
      {createdDate && (
        <div className="hidden lg:block w-24 text-xs text-gray-400 text-right">
          {createdDate}
        </div>
      )}
    </div>
  )
}

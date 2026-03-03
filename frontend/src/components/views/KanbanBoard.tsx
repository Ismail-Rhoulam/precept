"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export interface KanbanColumn {
  name: string
  column_id: number | null
  color: string
  count: number
  items: any[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCardClick: (item: any) => void
  onCardMove?: (itemId: number, fromColumnId: number | null, toColumnId: number | null) => void
  renderCard: (item: any) => React.ReactNode
  isLoading?: boolean
  entityType: string
}

interface DragState {
  itemId: number | null
  fromColumnId: number | null
}

function SkeletonCard() {
  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonColumn() {
  return (
    <Card className="flex-shrink-0 w-80 bg-muted/50">
      <CardHeader className="p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </CardContent>
    </Card>
  )
}

export default function KanbanBoard({
  columns,
  onCardClick,
  onCardMove,
  renderCard,
  isLoading,
  entityType,
}: KanbanBoardProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<DragState>({ itemId: null, fromColumnId: null })
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const dragImageRef = useRef<HTMLDivElement | null>(null)

  const toggleColumn = useCallback((columnName: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(columnName)) {
        next.delete(columnName)
      } else {
        next.add(columnName)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: number, fromColumnId: number | null) => {
      setDragState({ itemId, fromColumnId })
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, fromColumnId }))

      // Set a custom drag image if available
      if (dragImageRef.current) {
        e.dataTransfer.setDragImage(dragImageRef.current, 0, 0)
      }
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDragState({ itemId: null, fromColumnId: null })
    setDropTarget(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, columnName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTarget(columnName)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drop target if we're leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTarget(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, toColumnId: number | null) => {
      e.preventDefault()
      setDropTarget(null)

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"))
        const { itemId, fromColumnId } = data

        if (fromColumnId !== toColumnId && onCardMove) {
          onCardMove(itemId, fromColumnId, toColumnId)
        }
      } catch {
        // Ignore invalid drag data
      }

      setDragState({ itemId: null, fromColumnId: null })
    },
    [onCardMove]
  )

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonColumn key={i} />
        ))}
      </div>
    )
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <GripVertical className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No {entityType} data available
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          There are no columns to display in the Kanban view. Try adjusting your filters or add some {entityType}.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Hidden drag image element */}
      <div ref={dragImageRef} className="fixed -left-[9999px]" aria-hidden="true">
        <Card className="px-4 py-2">
          <span className="text-sm text-muted-foreground">Moving...</span>
        </Card>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-1 min-h-[400px]">
        {columns.map((column) => {
          const isCollapsed = collapsedColumns.has(column.name)
          const isDropping = dropTarget === column.name && dragState.fromColumnId !== column.column_id

          return (
            <Card
              key={column.name}
              className={cn(
                "flex-shrink-0 border-2 transition-colors duration-150 rounded-lg",
                isCollapsed ? "w-12" : "w-80",
                isDropping
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-border bg-muted/40"
              )}
              onDragOver={(e) => handleDragOver(e, column.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.column_id)}
            >
              {/* Column Header */}
              <CardHeader
                className="p-3 cursor-pointer select-none"
                onClick={() => toggleColumn(column.name)}
              >
                {isCollapsed ? (
                  <div className="flex flex-col items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        color: column.color || "#374151",
                      }}
                    >
                      {column.name}
                    </span>
                    <Badge
                      className="min-w-[20px] justify-center rounded-full text-xs text-white border-transparent"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    >
                      {column.count}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {column.name}
                    </span>
                    <Badge
                      className="min-w-[20px] justify-center rounded-full text-xs text-white flex-shrink-0 border-transparent"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    >
                      {column.count}
                    </Badge>
                  </div>
                )}
              </CardHeader>

              {/* Column Body */}
              {!isCollapsed && (
                <CardContent className="px-3 pb-3 pt-0 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {column.items.length === 0 ? (
                    <div className="flex items-center justify-center py-8 px-4">
                      <p className="text-xs text-muted-foreground text-center">
                        No {entityType} in this column
                      </p>
                    </div>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.id, column.column_id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onCardClick(item)}
                        className={cn(
                          "cursor-grab active:cursor-grabbing transition-opacity duration-150",
                          dragState.itemId === item.id ? "opacity-40" : "opacity-100"
                        )}
                      >
                        {renderCard(item)}
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}

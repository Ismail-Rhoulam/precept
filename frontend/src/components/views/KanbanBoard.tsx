"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"

export interface KanbanColumn {
  name: string
  color: string
  count: number
  items: any[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCardClick: (item: any) => void
  onCardMove?: (itemId: number, fromColumn: string, toColumn: string) => void
  renderCard: (item: any) => React.ReactNode
  isLoading?: boolean
  entityType: string
}

interface DragState {
  itemId: number | null
  fromColumn: string | null
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="flex items-center gap-2 mt-3">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-12" />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="h-6 w-6 bg-gray-200 rounded-full" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  )
}

function SkeletonColumn() {
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-3 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-5 bg-gray-200 rounded-full w-8" />
        </div>
      </div>
      <div className="p-3 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
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
  const [dragState, setDragState] = useState<DragState>({ itemId: null, fromColumn: null })
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
    (e: React.DragEvent, itemId: number, fromColumn: string) => {
      setDragState({ itemId, fromColumn })
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, fromColumn }))

      // Set a custom drag image if available
      if (dragImageRef.current) {
        e.dataTransfer.setDragImage(dragImageRef.current, 0, 0)
      }
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDragState({ itemId: null, fromColumn: null })
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
    (e: React.DragEvent, toColumn: string) => {
      e.preventDefault()
      setDropTarget(null)

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"))
        const { itemId, fromColumn } = data

        if (fromColumn !== toColumn && onCardMove) {
          onCardMove(itemId, fromColumn, toColumn)
        }
      } catch {
        // Ignore invalid drag data
      }

      setDragState({ itemId: null, fromColumn: null })
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
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <GripVertical className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No {entityType} data available
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          There are no columns to display in the Kanban view. Try adjusting your filters or add some {entityType}.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Hidden drag image element */}
      <div ref={dragImageRef} className="fixed -left-[9999px]" aria-hidden="true">
        <div className="bg-white rounded shadow-lg px-4 py-2 text-sm text-gray-700">
          Moving...
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-1 min-h-[400px]">
        {columns.map((column) => {
          const isCollapsed = collapsedColumns.has(column.name)
          const isDropping = dropTarget === column.name && dragState.fromColumn !== column.name

          return (
            <div
              key={column.name}
              className={cn(
                "flex-shrink-0 rounded-lg border-2 transition-colors duration-150",
                isCollapsed ? "w-12" : "w-80",
                isDropping
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-gray-200 bg-gray-50/80"
              )}
              onDragOver={(e) => handleDragOver(e, column.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.name)}
            >
              {/* Column Header */}
              <div
                className="p-3 cursor-pointer select-none"
                onClick={() => toggleColumn(column.name)}
              >
                {isCollapsed ? (
                  <div className="flex flex-col items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    <span
                      className="text-xs font-semibold writing-mode-vertical"
                      style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        color: column.color || "#374151",
                      }}
                    >
                      {column.name}
                    </span>
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    >
                      {column.count}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    />
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {column.name}
                    </span>
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: column.color || "#6B7280" }}
                    >
                      {column.count}
                    </span>
                  </div>
                )}
              </div>

              {/* Column Body */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {column.items.length === 0 ? (
                    <div className="flex items-center justify-center py-8 px-4">
                      <p className="text-xs text-gray-400 text-center">
                        No {entityType} in this column
                      </p>
                    </div>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.id, column.name)}
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
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

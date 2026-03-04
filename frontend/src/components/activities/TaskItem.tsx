"use client"

import { useState } from "react"
import { CheckSquare, Square, Trash2, Calendar, User } from "lucide-react"
import { formatDistanceToNow, isPast, parseISO } from "date-fns"
import type { Task } from "@/types/task"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TaskItemProps {
  task: Task
  onStatusChange?: (taskId: number, newStatus: string) => void
  onDelete?: (taskId: number) => void
}

const priorityConfig: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-red-100 text-red-800",
}

const statusConfig: Record<string, string> = {
  Backlog: "bg-muted text-muted-foreground",
  Todo: "bg-blue-100 text-blue-800",
  "In Progress": "bg-purple-100 text-purple-800",
  Done: "bg-green-100 text-green-800",
  Canceled: "bg-red-100 text-red-600",
}

export function TaskItem({ task, onStatusChange, onDelete }: TaskItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isDone = task.status === "Done"
  const isOverdue =
    task.due_date && !isDone && isPast(parseISO(task.due_date))

  function handleToggleStatus() {
    if (!onStatusChange) return
    const newStatus = isDone ? "Todo" : "Done"
    onStatusChange(task.id, newStatus)
  }

  function handleDelete() {
    onDelete?.(task.id)
    setShowDeleteConfirm(false)
  }

  return (
    <Card className={cn("hover:shadow-sm transition-shadow", isDone && "opacity-70")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status checkbox */}
          <button
            onClick={handleToggleStatus}
            disabled={!onStatusChange}
            className={cn(
              "flex-shrink-0 mt-0.5 transition-colors",
              onStatusChange ? "cursor-pointer hover:text-primary" : "cursor-default",
              isDone ? "text-green-500" : "text-muted-foreground"
            )}
            title={isDone ? "Mark as Todo" : "Mark as Done"}
          >
            {isDone ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "text-sm font-medium text-foreground",
                  isDone && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>

              <div className="flex items-center gap-1 flex-shrink-0">
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Priority badge */}
              <Badge
                variant="secondary"
                className={cn(
                  "border-transparent",
                  priorityConfig[task.priority] || "bg-muted text-muted-foreground"
                )}
              >
                {task.priority}
              </Badge>

              {/* Status badge */}
              <Badge
                variant="secondary"
                className={cn(
                  "border-transparent",
                  statusConfig[task.status] || "bg-muted text-muted-foreground"
                )}
              >
                {task.status}
              </Badge>

              {/* Assigned user */}
              {task.assigned_to_name && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assigned_to_name}
                </span>
              )}

              {/* Due date */}
              {task.due_date && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {isOverdue ? "Overdue: " : ""}
                  {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="absolute right-4 top-4 p-3 bg-background border border-destructive/30 rounded-md shadow-lg z-10">
              <p className="text-sm text-destructive mb-2">Delete this task?</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

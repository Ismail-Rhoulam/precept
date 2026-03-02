"use client"

import { useState } from "react"
import { CheckSquare, Square, Trash2, Calendar, User } from "lucide-react"
import { formatDistanceToNow, isPast, parseISO } from "date-fns"
import type { Task } from "@/types/task"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Task
  onStatusChange?: (taskId: number, newStatus: string) => void
  onDelete?: (taskId: number) => void
}

const priorityConfig: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-red-100 text-red-800",
}

const statusConfig: Record<string, string> = {
  Backlog: "bg-gray-100 text-gray-700",
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
    <div
      className={cn(
        "flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow",
        isDone && "opacity-70"
      )}
    >
      {/* Status checkbox */}
      <button
        onClick={handleToggleStatus}
        disabled={!onStatusChange}
        className={cn(
          "flex-shrink-0 mt-0.5 transition-colors",
          onStatusChange ? "cursor-pointer hover:text-primary" : "cursor-default",
          isDone ? "text-green-500" : "text-gray-400"
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
              "text-sm font-medium text-gray-900",
              isDone && "line-through text-gray-500"
            )}
          >
            {task.title}
          </h3>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Priority badge */}
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              priorityConfig[task.priority] || "bg-gray-100 text-gray-700"
            )}
          >
            {task.priority}
          </span>

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              statusConfig[task.status] || "bg-gray-100 text-gray-700"
            )}
          >
            {task.status}
          </span>

          {/* Assigned user */}
          {task.assigned_to_name && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              {task.assigned_to_name}
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-medium" : "text-gray-500"
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
        <div className="absolute right-4 top-4 p-3 bg-white border border-red-200 rounded-md shadow-lg z-10">
          <p className="text-sm text-red-700 mb-2">Delete this task?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

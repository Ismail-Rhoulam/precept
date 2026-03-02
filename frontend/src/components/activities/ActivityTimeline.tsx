"use client"

import { useState } from "react"
import {
  MessageSquare,
  FileText,
  CheckSquare,
  Phone,
  ArrowRight,
  Plus,
  Loader2,
  PhoneIncoming,
  PhoneOutgoing,
  Inbox,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useActivities } from "@/hooks/useActivities"
import { useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/useNotes"
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks"
import { useDeleteComment } from "@/hooks/useComments"
import type { Activity } from "@/types/activity"
import type { Note } from "@/types/note"
import { cn } from "@/lib/utils"
import { CommentBox } from "./CommentBox"
import { NoteCard } from "./NoteCard"
import { TaskItem } from "./TaskItem"

interface ActivityTimelineProps {
  entityType: "lead" | "deal"
  entityId: number
}

type TabKey = "activity" | "comments" | "notes" | "tasks" | "calls"

const tabs: { key: TabKey; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "comments", label: "Comments" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "calls", label: "Calls" },
]

function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

// Icon for an activity type
function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
    comment: {
      icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
      bg: "bg-blue-100",
    },
    note: {
      icon: <FileText className="h-4 w-4 text-amber-600" />,
      bg: "bg-amber-100",
    },
    task: {
      icon: <CheckSquare className="h-4 w-4 text-purple-600" />,
      bg: "bg-purple-100",
    },
    call_log: {
      icon: <Phone className="h-4 w-4 text-green-600" />,
      bg: "bg-green-100",
    },
    status_change: {
      icon: <ArrowRight className="h-4 w-4 text-indigo-600" />,
      bg: "bg-indigo-100",
    },
    creation: {
      icon: <Plus className="h-4 w-4 text-gray-600" />,
      bg: "bg-gray-100",
    },
  }

  const config = iconMap[type] || iconMap.creation

  return (
    <div
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        config.bg
      )}
    >
      {config.icon}
    </div>
  )
}

function ActivityEntry({ activity }: { activity: Activity }) {
  const data = activity.data || {}

  function renderContent() {
    switch (activity.activity_type) {
      case "comment":
        return (
          <div>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" left a comment"}
            </p>
            {data.content && (
              <div
                className="mt-1 text-sm text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            )}
          </div>
        )
      case "note":
        return (
          <div>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" added a note"}
            </p>
            {data.title && (
              <p className="mt-1 text-sm font-medium text-gray-700">{data.title}</p>
            )}
            {data.content && (
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
                {data.content}
              </p>
            )}
          </div>
        )
      case "task":
        return (
          <div>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" created a task"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {data.title && (
                <span className="text-sm text-gray-700">{data.title}</span>
              )}
              {data.status && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {data.status}
                </span>
              )}
              {data.priority && (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    data.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : data.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                  )}
                >
                  {data.priority}
                </span>
              )}
            </div>
            {data.assigned_to_name && (
              <p className="mt-1 text-xs text-gray-500">
                Assigned to {data.assigned_to_name}
              </p>
            )}
          </div>
        )
      case "call_log":
        return (
          <div>
            <p className="text-sm text-gray-900 flex items-center gap-1.5">
              <span className="font-medium">{activity.user_name || "System"}</span>
              {data.call_type === "Incoming" ? (
                <PhoneIncoming className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>{data.call_type || "Call"}</span>
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              {data.status && <span>Status: {data.status}</span>}
              {data.duration && <span>Duration: {data.duration}</span>}
              {data.caller_name && <span>From: {data.caller_name}</span>}
              {data.receiver_name && <span>To: {data.receiver_name}</span>}
            </div>
          </div>
        )
      case "status_change":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{activity.user_name || "Someone"}</span>
            {" changed status from "}
            <span className="font-medium text-gray-700">{data.old_status || "Unknown"}</span>
            {" to "}
            <span className="font-medium text-gray-700">{data.new_status || "Unknown"}</span>
          </p>
        )
      case "creation":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{activity.user_name || "Someone"}</span>
            {" created this record"}
          </p>
        )
      default:
        return (
          <p className="text-sm text-gray-500">Activity logged</p>
        )
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative flex flex-col items-center">
        <ActivityIcon type={activity.activity_type} />
        <div className="flex-1 w-px bg-gray-200 mt-2" />
      </div>
      <div className="flex-1 pb-6">
        {renderContent()}
        <p className="mt-1 text-xs text-gray-400">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

// Inline note creation form
function NoteForm({
  entityType,
  entityId,
  onDone,
}: {
  entityType: string
  entityId: number
  onDone: () => void
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const createNote = useCreateNote()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createNote.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        entity_type: entityType,
        entity_id: entityId,
      })
      setTitle("")
      setContent("")
      onDone()
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Note content..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />
      {createNote.isError && (
        <p className="text-sm text-red-600">
          {createNote.error instanceof Error ? createNote.error.message : "Failed to create note"}
        </p>
      )}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || createNote.isPending}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            !title.trim() || createNote.isPending
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {createNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {createNote.isPending ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  )
}

// Inline task creation form
function TaskForm({
  entityType,
  entityId,
  onDone,
}: {
  entityType: string
  entityId: number
  onDone: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [status, setStatus] = useState("Todo")
  const [dueDate, setDueDate] = useState("")
  const createTask = useCreateTask()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate || null,
        entity_type: entityType,
        entity_id: entityId,
      })
      setTitle("")
      setDescription("")
      setPriority("Medium")
      setStatus("Todo")
      setDueDate("")
      onDone()
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="Backlog">Backlog</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      {createTask.isError && (
        <p className="text-sm text-red-600">
          {createTask.error instanceof Error ? createTask.error.message : "Failed to create task"}
        </p>
      )}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || createTask.isPending}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            !title.trim() || createTask.isPending
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {createTask.isPending ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  )
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("activity")
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  const { data, isLoading, isError } = useActivities(entityType, entityId)
  const deleteComment = useDeleteComment()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const activities = data?.activities || []
  const comments = data?.comments || []
  const notes = data?.notes || []
  const tasks = data?.tasks || []
  const callLogs = data?.call_logs || []

  function handleEditNote(note: Note) {
    setEditingNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  async function handleSaveNoteEdit() {
    if (!editingNote || !editTitle.trim()) return
    try {
      await updateNote.mutateAsync({
        id: editingNote.id,
        data: { title: editTitle.trim(), content: editContent.trim() },
      })
      setEditingNote(null)
      setEditTitle("")
      setEditContent("")
    } catch {
      // Error surfaced via mutation
    }
  }

  function handleCancelNoteEdit() {
    setEditingNote(null)
    setEditTitle("")
    setEditContent("")
  }

  function handleDeleteNote(noteId: number) {
    deleteNote.mutate(noteId)
  }

  function handleTaskStatusChange(taskId: number, newStatus: string) {
    updateTask.mutate({ id: taskId, data: { status: newStatus } })
  }

  function handleDeleteTask(taskId: number) {
    deleteTask.mutate(taskId)
  }

  function handleDeleteComment(commentId: number) {
    deleteComment.mutate(commentId)
  }

  function renderTabContent() {
    if (isLoading) return <TimelineSkeleton />

    if (isError) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600">Failed to load activities. Please try again.</p>
        </div>
      )
    }

    switch (activeTab) {
      case "activity":
        if (activities.length === 0) {
          return <EmptyState message="No activity yet" />
        }
        return (
          <div className="relative">
            {activities.map((activity, index) => (
              <ActivityEntry key={`${activity.activity_type}-${activity.id}-${index}`} activity={activity} />
            ))}
          </div>
        )

      case "comments":
        return (
          <div className="space-y-4">
            <CommentBox entityType={entityType} entityId={entityId} />
            {comments.length === 0 ? (
              <EmptyState message="No comments yet. Be the first to comment!" />
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-4 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-700">
                        {(comment.comment_by_name || "U")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.comment_by_name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete comment"
                          >
                            <span className="text-xs">x</span>
                          </button>
                        </div>
                      </div>
                      <div
                        className="mt-1 text-sm text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "notes":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              {!showNoteForm && (
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </button>
              )}
            </div>

            {showNoteForm && (
              <NoteForm
                entityType={entityType}
                entityId={entityId}
                onDone={() => setShowNoteForm(false)}
              />
            )}

            {/* Note editing inline form */}
            {editingNote && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Edit Note</h4>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {updateNote.isError && (
                  <p className="text-sm text-red-600">Failed to update note</p>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={handleCancelNoteEdit}
                    className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNoteEdit}
                    disabled={!editTitle.trim() || updateNote.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      !editTitle.trim() || updateNote.isPending
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {updateNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            )}

            {notes.length === 0 && !showNoteForm ? (
              <EmptyState message="No notes yet" />
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </div>
        )

      case "tasks":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              {!showTaskForm && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              )}
            </div>

            {showTaskForm && (
              <TaskForm
                entityType={entityType}
                entityId={entityId}
                onDone={() => setShowTaskForm(false)}
              />
            )}

            {tasks.length === 0 && !showTaskForm ? (
              <EmptyState message="No tasks yet" />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        )

      case "calls":
        if (callLogs.length === 0) {
          return <EmptyState message="No call logs yet" />
        }
        return (
          <div className="space-y-3">
            {callLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    log.call_type === "Incoming"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  )}
                >
                  {log.call_type === "Incoming" ? (
                    <PhoneIncoming className="h-4 w-4 text-green-600" />
                  ) : (
                    <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {log.call_type} Call
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        log.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : log.status === "Missed"
                            ? "bg-red-100 text-red-800"
                            : log.status === "Failed"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {log.caller_name && <span>From: {log.caller_name}</span>}
                    {log.receiver_name && <span>To: {log.receiver_name}</span>}
                    {log.duration && <span>Duration: {log.duration}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6" aria-label="Activity tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "py-4 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
              {tab.key === "comments" && comments.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {comments.length}
                </span>
              )}
              {tab.key === "tasks" && tasks.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {tasks.length}
                </span>
              )}
              {tab.key === "notes" && notes.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {notes.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">{renderTabContent()}</div>
    </div>
  )
}

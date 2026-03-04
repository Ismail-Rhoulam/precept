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
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-shrink-0">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
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
      icon: <Plus className="h-4 w-4 text-muted-foreground" />,
      bg: "bg-muted",
    },
  }

  const config = iconMap[type] || iconMap.creation

  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback className={config.bg}>
        {config.icon}
      </AvatarFallback>
    </Avatar>
  )
}

function ActivityEntry({ activity }: { activity: Activity }) {
  const data = activity.data || {}

  function renderContent() {
    switch (activity.activity_type) {
      case "comment":
        return (
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" left a comment"}
            </p>
            {data.content && (
              <div
                className="mt-1 text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            )}
          </div>
        )
      case "note":
        return (
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" added a note"}
            </p>
            {data.title && (
              <p className="mt-1 text-sm font-medium text-foreground/80">{data.title}</p>
            )}
            {data.content && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                {data.content}
              </p>
            )}
          </div>
        )
      case "task":
        return (
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{activity.user_name || "Someone"}</span>
              {" created a task"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {data.title && (
                <span className="text-sm text-foreground/80">{data.title}</span>
              )}
              {data.status && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-transparent">
                  {data.status}
                </Badge>
              )}
              {data.priority && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-transparent",
                    data.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : data.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {data.priority}
                </Badge>
              )}
            </div>
            {data.assigned_to_name && (
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned to {data.assigned_to_name}
              </p>
            )}
          </div>
        )
      case "call_log":
        return (
          <div>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <span className="font-medium">{activity.user_name || "System"}</span>
              {data.call_type === "Incoming" ? (
                <PhoneIncoming className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span>{data.call_type || "Call"}</span>
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {data.status && <span>Status: {data.status}</span>}
              {data.duration && <span>Duration: {data.duration}</span>}
              {data.caller_name && <span>From: {data.caller_name}</span>}
              {data.receiver_name && <span>To: {data.receiver_name}</span>}
            </div>
          </div>
        )
      case "status_change":
        return (
          <p className="text-sm text-foreground">
            <span className="font-medium">{activity.user_name || "Someone"}</span>
            {" changed status from "}
            <span className="font-medium text-foreground/80">{data.old_status || "Unknown"}</span>
            {" to "}
            <span className="font-medium text-foreground/80">{data.new_status || "Unknown"}</span>
          </p>
        )
      case "creation":
        return (
          <p className="text-sm text-foreground">
            <span className="font-medium">{activity.user_name || "Someone"}</span>
            {" created this record"}
          </p>
        )
      default:
        return (
          <p className="text-sm text-muted-foreground">Activity logged</p>
        )
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative flex flex-col items-center">
        <ActivityIcon type={activity.activity_type} />
        <div className="flex-1 w-px bg-border mt-2" />
      </div>
      <div className="flex-1 pb-6">
        {renderContent()}
        <p className="mt-1 text-xs text-muted-foreground/60">
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
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content..."
            rows={3}
            className="resize-none"
          />
          {createNote.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {createNote.error instanceof Error ? createNote.error.message : "Failed to create note"}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createNote.isPending}
            >
              {createNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createNote.isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description..."
            rows={2}
            className="resize-none"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="block text-xs text-muted-foreground mb-1">Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <Label className="block text-xs text-muted-foreground mb-1">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Backlog">Backlog</option>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            <div>
              <Label className="block text-xs text-muted-foreground mb-1">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          {createTask.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {createTask.error instanceof Error ? createTask.error.message : "Failed to create task"}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
            >
              {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
          <Alert variant="destructive" className="inline-flex">
            <AlertDescription>Failed to load activities. Please try again.</AlertDescription>
          </Alert>
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
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-xs font-medium text-blue-700">
                            {(comment.comment_by_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {comment.comment_by_name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground/60">
                                {formatDistanceToNow(new Date(comment.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete comment"
                              >
                                <span className="text-xs">x</span>
                              </Button>
                            </div>
                          </div>
                          <div
                            className="mt-1 text-sm text-muted-foreground prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                <Button onClick={() => setShowNoteForm(true)}>
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
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
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground/80">Edit Note</h4>
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  {updateNote.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>Failed to update note</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" onClick={handleCancelNoteEdit}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveNoteEdit}
                      disabled={!editTitle.trim() || updateNote.isPending}
                    >
                      {updateNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                <Button onClick={() => setShowTaskForm(true)}>
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
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
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={cn(
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
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {log.call_type} Call
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-transparent",
                            log.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : log.status === "Missed"
                                ? "bg-red-100 text-red-800"
                                : log.status === "Failed"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-muted text-muted-foreground"
                          )}
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {log.caller_name && <span>From: {log.caller_name}</span>}
                        {log.receiver_name && <span>To: {log.receiver_name}</span>}
                        {log.duration && <span>Duration: {log.duration}</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
    }
  }

  return (
    <Card>
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex -mb-px px-6" aria-label="Activity tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "py-4 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
              {tab.key === "comments" && comments.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 rounded-full text-xs">
                  {comments.length}
                </Badge>
              )}
              {tab.key === "tasks" && tasks.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 rounded-full text-xs">
                  {tasks.length}
                </Badge>
              )}
              {tab.key === "notes" && notes.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 rounded-full text-xs">
                  {notes.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <CardContent className="p-6">{renderTabContent()}</CardContent>
    </Card>
  )
}

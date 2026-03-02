import type { Comment } from "./comment"
import type { Note } from "./note"
import type { Task } from "./task"
import type { CallLog } from "./call-log"

// Activity timeline entry (unified)
export interface Activity {
  id: number
  activity_type: "comment" | "note" | "task" | "call_log" | "status_change" | "creation"
  created_at: string
  user_email: string | null
  user_name: string | null
  data: Record<string, any> | null
}

export interface ActivitiesResponse {
  activities: Activity[]
  comments: Comment[]
  notes: Note[]
  tasks: Task[]
  call_logs: CallLog[]
}

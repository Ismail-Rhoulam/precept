export interface Notification {
  id: number
  notification_text: string
  from_user_email: string | null
  from_user_name: string | null
  to_user_email: string | null
  type: "Mention" | "Task" | "Assignment" | "WhatsApp"
  read: boolean
  message: string
  reference_doctype: string | null
  reference_id: number | null
  created_at: string
}

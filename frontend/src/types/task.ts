export interface Task {
  id: number
  title: string
  description: string
  priority: "Low" | "Medium" | "High"
  status: "Backlog" | "Todo" | "In Progress" | "Done" | "Canceled"
  assigned_to_id: number | null
  assigned_to_name: string | null
  assigned_to_email: string | null
  start_date: string | null
  due_date: string | null
  entity_type: string | null
  entity_id: number | null
  created_at: string
  updated_at: string
  created_by_email: string | null
}

export interface TaskCreate {
  title: string
  description?: string
  priority?: string
  status?: string
  assigned_to_id?: number | null
  start_date?: string | null
  due_date?: string | null
  entity_type?: string
  entity_id?: number
}

export interface TaskUpdate {
  title?: string
  description?: string
  priority?: string
  status?: string
  assigned_to_id?: number | null
  start_date?: string | null
  due_date?: string | null
}

export interface TaskListParams {
  status?: string
  priority?: string
  assigned_to_id?: number
  entity_type?: string
  entity_id?: number
  page?: number
  page_size?: number
}

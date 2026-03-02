export interface ViewSettings {
  id: number
  label: string
  icon: string
  user_id: number | null
  user_email: string | null
  is_standard: boolean
  is_default: boolean
  type: "list" | "kanban" | "group_by"
  entity_type: string
  route_name: string
  pinned: boolean
  public: boolean
  filters: Record<string, any>
  order_by: Record<string, string>
  columns: ColumnDef[]
  rows: string[]
  load_default_columns: boolean
  group_by_field: string
  column_field: string
  title_field: string
  kanban_columns: KanbanColumnDef[]
  kanban_fields: string[]
  created_at: string
  updated_at: string
}

export interface ViewSettingsCreate {
  label: string
  icon?: string
  type: "list" | "kanban" | "group_by"
  entity_type: string
  filters?: Record<string, any>
  order_by?: Record<string, string>
  columns?: ColumnDef[]
  rows?: string[]
  group_by_field?: string
  column_field?: string
  title_field?: string
  kanban_columns?: KanbanColumnDef[]
  kanban_fields?: string[]
  pinned?: boolean
  public?: boolean
}

export interface ColumnDef {
  key: string
  label: string
  type: string
  width?: string
}

export interface KanbanColumnDef {
  name: string
  color: string
  order?: string[]
}

export interface KanbanData {
  columns: KanbanColumn[]
}

export interface KanbanColumn {
  name: string
  color: string
  count: number
  items: any[]
}

export interface GroupByData {
  groups: GroupByGroup[]
  results: any[]
  total: number
}

export interface GroupByGroup {
  value: string | null
  count: number
}

export interface FilterCondition {
  field: string
  operator:
    | "="
    | "!="
    | "like"
    | "not_like"
    | "in"
    | "not_in"
    | ">"
    | "<"
    | ">="
    | "<="
    | "is_set"
    | "is_not_set"
  value: any
}

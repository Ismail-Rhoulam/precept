export interface SLA {
  id: number
  sla_name: string
  apply_on: "Lead" | "Deal"
  enabled: boolean
  is_default: boolean
  rolling_responses: boolean
  condition: string
  condition_json: Record<string, any>
  start_date: string | null
  end_date: string | null
  holiday_list_name: string | null
  priorities: SLAPriority[]
  working_hours: ServiceDay[]
  created_at: string
  updated_at: string
}

export interface SLAPriority {
  id: number
  priority: string
  response_time_seconds: number
}

export interface ServiceDay {
  id: number
  day: string
  start_time: string
  end_time: string
}

export interface SLACreate {
  sla_name: string
  apply_on: "Lead" | "Deal"
  enabled?: boolean
  is_default?: boolean
  condition?: string
  condition_json?: Record<string, any>
  start_date?: string | null
  end_date?: string | null
  holiday_list_id?: number | null
  priorities: { priority: string; response_time_seconds: number }[]
  working_hours: { day: string; start_time: string; end_time: string }[]
}

export interface SLAUpdate extends Partial<SLACreate> {}

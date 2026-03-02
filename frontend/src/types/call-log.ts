export interface CallLog {
  id: number
  call_id: string
  caller_number: string
  receiver_number: string
  status: "Initiated" | "Ringing" | "In Progress" | "Completed" | "Missed" | "Failed"
  call_type: "Incoming" | "Outgoing"
  duration: string | null
  start_time: string | null
  end_time: string | null
  recording_url: string
  telephony_medium: string
  caller_email: string | null
  caller_name: string | null
  receiver_email: string | null
  receiver_name: string | null
  entity_type: string | null
  entity_id: number | null
  created_at: string
}

export interface CallLogCreate {
  caller_number: string
  receiver_number: string
  status?: string
  call_type?: string
  duration_seconds?: number | null
  start_time?: string | null
  end_time?: string | null
  recording_url?: string
  telephony_medium?: string
  caller_id?: number | null
  receiver_id?: number | null
  entity_type?: string
  entity_id?: number
}

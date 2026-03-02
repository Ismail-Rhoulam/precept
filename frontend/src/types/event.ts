export interface CalendarEvent {
  id: number
  subject: string
  description: string
  location: string
  starts_on: string
  ends_on: string | null
  all_day: boolean
  event_type: "Private" | "Public"
  color: string
  entity_type: string
  entity_id: number | null
  owner_name: string
  owner_email: string
  participants: EventParticipant[]
  created_at: string
}

export interface EventParticipant {
  id: number
  user_id: number | null
  email: string
  attending: "Yes" | "No" | "Maybe"
}

export interface EventCreate {
  subject: string
  description?: string
  location?: string
  starts_on: string
  ends_on?: string
  all_day?: boolean
  event_type?: string
  color?: string
  entity_type?: string
  entity_id?: number
  participants?: { email: string }[]
}

export interface EventUpdate extends Partial<EventCreate> {}

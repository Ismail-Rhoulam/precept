export interface Note {
  id: number
  title: string
  content: string
  entity_type: string | null
  entity_id: number | null
  created_at: string
  updated_at: string
  created_by_email: string | null
  created_by_name: string | null
}

export interface NoteCreate {
  title: string
  content?: string
  entity_type?: string
  entity_id?: number
}

export interface NoteUpdate {
  title?: string
  content?: string
}

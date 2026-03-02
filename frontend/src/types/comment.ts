export interface Comment {
  id: number
  content: string
  comment_by_id: number | null
  comment_by_email: string | null
  comment_by_name: string | null
  entity_type: string | null
  entity_id: number | null
  created_at: string
}

export interface CommentCreate {
  content: string
  entity_type: string
  entity_id: number
}

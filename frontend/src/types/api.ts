export interface PaginatedResponse<T> {
  results: T[]
  total: number
  page: number
  page_size: number
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  company_id: number | null
  company_name: string | null
  avatar: string | null
}

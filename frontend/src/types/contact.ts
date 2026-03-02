export interface Contact {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email_id: string
  mobile_no: string
  phone: string
  gender: string
  salutation: string
  company_name: string
  designation: string
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  first_name: string
  last_name: string
  email_id?: string
  mobile_no?: string
  phone?: string
  gender?: string
  salutation?: string
  company_name?: string
  designation?: string
}

export interface ContactListParams {
  page?: number
  page_size?: number
  search?: string
  company_name?: string
  designation?: string
  ordering?: string
}

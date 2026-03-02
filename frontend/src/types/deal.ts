export interface Deal {
  id: number
  reference_id: string
  organization_name: string | null
  status: string
  status_color: string | null
  deal_owner_email: string | null
  deal_owner_name: string | null
  deal_value: number
  probability: number
  expected_closure_date: string | null
  currency: string
  lead_name: string | null
  source: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  mobile_no: string | null
  created_at: string
  updated_at: string
}

export interface DealCreate {
  first_name: string
  last_name?: string
  email?: string
  mobile_no?: string
  organization_name?: string
  deal_value?: number
  currency?: string
  status?: string
  probability?: number
  expected_closure_date?: string
  source?: string
  deal_owner_email?: string
  lead_name?: string
}

export interface DealListParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  source?: string
  deal_owner_email?: string
  ordering?: string
}

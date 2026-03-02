export interface Lead {
  id: number
  reference_id: string
  first_name: string
  last_name: string
  lead_name: string
  email: string
  mobile_no: string
  organization: string
  status: string
  status_color: string
  lead_owner_email: string | null
  lead_owner_name: string | null
  source: string | null
  industry: string | null
  territory: string | null
  converted: boolean
  sla_status: string
  created_at: string
  updated_at: string
}

export interface LeadCreate {
  first_name: string
  last_name: string
  email: string
  mobile_no?: string
  organization?: string
  status?: string
  source?: string
  industry?: string
  territory?: string
  lead_owner_email?: string
}

export interface LeadListParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  source?: string
  industry?: string
  lead_owner_email?: string
  ordering?: string
}

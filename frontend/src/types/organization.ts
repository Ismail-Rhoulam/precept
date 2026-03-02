export interface Organization {
  id: number
  organization_name: string
  website: string
  no_of_employees: number
  annual_revenue: number
  industry: string
  territory: string
  currency: string
  created_at: string
  updated_at: string
}

export interface OrganizationCreate {
  organization_name: string
  website?: string
  no_of_employees?: number
  annual_revenue?: number
  industry_id?: number
  territory_id?: number
  currency?: string
}

export interface OrganizationListParams {
  page?: number
  page_size?: number
  search?: string
  industry?: string
  territory?: string
  ordering?: string
}

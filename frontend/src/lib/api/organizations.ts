import { api } from "./client"
import type { Organization, OrganizationCreate, OrganizationListParams } from "@/types/organization"
import type { PaginatedResponse } from "@/types/api"

export const organizationsApi = {
  list: (params?: OrganizationListParams) =>
    api.get<PaginatedResponse<Organization>>("/crm/organizations/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Organization>(`/crm/organizations/${id}`),

  create: (data: OrganizationCreate) =>
    api.post<Organization>("/crm/organizations/", data),

  update: (id: number, data: Partial<OrganizationCreate>) =>
    api.patch<Organization>(`/crm/organizations/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/organizations/${id}`),

  bulkDelete: (ids: number[]) =>
    api.post("/crm/organizations/bulk-delete", { ids }),
}

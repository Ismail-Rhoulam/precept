import { api } from "./client"
import type { Lead, LeadCreate, LeadListParams } from "@/types/lead"
import type { PaginatedResponse } from "@/types/api"

export const leadsApi = {
  list: (params?: LeadListParams) =>
    api.get<PaginatedResponse<Lead>>("/crm/leads/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Lead>(`/crm/leads/${id}`),

  create: (data: LeadCreate) =>
    api.post<Lead>("/crm/leads/", data),

  update: (id: number, data: Partial<LeadCreate>) =>
    api.patch<Lead>(`/crm/leads/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/leads/${id}`),

  bulkDelete: (ids: number[]) =>
    api.post("/crm/leads/bulk-delete", { ids }),
}

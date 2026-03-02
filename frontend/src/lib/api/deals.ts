import { api } from "./client"
import type { Deal, DealCreate, DealListParams } from "@/types/deal"
import type { PaginatedResponse } from "@/types/api"

export const dealsApi = {
  list: (params?: DealListParams) =>
    api.get<PaginatedResponse<Deal>>("/crm/deals/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Deal>(`/crm/deals/${id}`),

  create: (data: DealCreate) =>
    api.post<Deal>("/crm/deals/", data),

  update: (id: number, data: Partial<DealCreate>) =>
    api.patch<Deal>(`/crm/deals/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/deals/${id}`),

  bulkDelete: (ids: number[]) =>
    api.post("/crm/deals/bulk-delete", { ids }),
}

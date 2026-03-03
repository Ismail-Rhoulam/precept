import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead } from "@/types/lead"
import type { Deal } from "@/types/deal"

export interface KanbanColumn<T = any> {
  name: string
  column_id: number | null
  color: string
  count: number
  items: T[]
}

export interface KanbanResponse<T = any> {
  columns: KanbanColumn<T>[]
}

interface KanbanParams {
  column_field?: string
  page_size?: number
  filters?: Record<string, any>
}

function buildKanbanParams(params?: KanbanParams): Record<string, string | number | boolean | undefined> {
  if (!params) return {}
  const result: Record<string, string | number | boolean | undefined> = {}
  if (params.column_field) result.column_field = params.column_field
  if (params.page_size) result.page_size = params.page_size
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        result[key] = String(value)
      }
    })
  }
  return result
}

export function useLeadKanban(params?: KanbanParams) {
  return useQuery({
    queryKey: ["leads", "kanban", params],
    queryFn: () =>
      api.get<KanbanResponse<Lead>>("/crm/leads/kanban", {
        params: buildKanbanParams(params),
      }),
  })
}

export function useDealKanban(params?: KanbanParams) {
  return useQuery({
    queryKey: ["deals", "kanban", params],
    queryFn: () =>
      api.get<KanbanResponse<Deal>>("/crm/deals/kanban", {
        params: buildKanbanParams(params),
      }),
  })
}

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead } from "@/types/lead"
import type { Deal } from "@/types/deal"

export interface GroupByGroup {
  value: string | null
  count: number
}

export interface GroupByResponse<T = any> {
  groups: GroupByGroup[]
  results: T[]
  total: number
}

interface GroupByParams {
  group_by_field?: string
  filters?: Record<string, any>
}

function buildGroupByParams(params?: GroupByParams): Record<string, string | number | boolean | undefined> {
  if (!params) return {}
  const result: Record<string, string | number | boolean | undefined> = {}
  if (params.group_by_field) result.group_by_field = params.group_by_field
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        result[key] = String(value)
      }
    })
  }
  return result
}

export function useLeadGroupBy(params?: GroupByParams) {
  return useQuery({
    queryKey: ["leads", "group-by", params],
    queryFn: () =>
      api.get<GroupByResponse<Lead>>("/crm/leads/group-by", {
        params: buildGroupByParams(params),
      }),
  })
}

export function useDealGroupBy(params?: GroupByParams) {
  return useQuery({
    queryKey: ["deals", "group-by", params],
    queryFn: () =>
      api.get<GroupByResponse<Deal>>("/crm/deals/group-by", {
        params: buildGroupByParams(params),
      }),
  })
}

import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardFilters } from "@/types/dashboard"

export function useDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => dashboardApi.get(filters.from_date, filters.to_date),
  })
}

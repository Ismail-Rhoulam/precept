import { api } from "./client"
import type { DashboardData } from "@/types/dashboard"

export const dashboardApi = {
  get: (fromDate: string, toDate: string) =>
    api.get<DashboardData>("/dashboard/", {
      params: { from_date: fromDate, to_date: toDate },
    }),
}

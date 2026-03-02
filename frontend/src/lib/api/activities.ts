import { api } from "./client"
import type { ActivitiesResponse } from "@/types/activity"

export const activitiesApi = {
  getActivities: (entityType: string, entityId: number) =>
    api.get<ActivitiesResponse>(`/comm/activities/${entityType}/${entityId}`),
}

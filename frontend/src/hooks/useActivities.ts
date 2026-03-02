import { useQuery } from "@tanstack/react-query"
import { activitiesApi } from "@/lib/api/activities"

export function useActivities(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ["activities", entityType, entityId],
    queryFn: () => activitiesApi.getActivities(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

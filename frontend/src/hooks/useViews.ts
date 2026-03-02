import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { viewsApi } from "@/lib/api/views"
import type { ViewSettingsCreate } from "@/types/view"

export function useViews(entityType: string) {
  return useQuery({
    queryKey: ["views", entityType],
    queryFn: () => viewsApi.list(entityType),
    enabled: !!entityType,
  })
}

export function useView(id: number) {
  return useQuery({
    queryKey: ["views", "detail", id],
    queryFn: () => viewsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ViewSettingsCreate) => viewsApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["views", variables.entity_type] })
    },
  })
}

export function useUpdateView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ViewSettingsCreate> }) =>
      viewsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["views"] })
      queryClient.invalidateQueries({ queryKey: ["views", "detail", variables.id] })
    },
  })
}

export function useDeleteView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => viewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views"] })
    },
  })
}

export function useSetDefaultView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => viewsApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views"] })
    },
  })
}

export function usePinView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => viewsApi.pin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views"] })
    },
  })
}

export function useTogglePublicView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => viewsApi.togglePublic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views"] })
    },
  })
}

export function useSaveStandardView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ViewSettingsCreate) => viewsApi.createOrUpdateStandard(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["views", variables.entity_type] })
    },
  })
}

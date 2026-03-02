import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { slaApi } from "@/lib/api/sla"
import type { SLACreate, SLAUpdate } from "@/types/sla"

export function useSLAs() {
  return useQuery({
    queryKey: ["slas"],
    queryFn: () => slaApi.list(),
  })
}

export function useSLA(id: number) {
  return useQuery({
    queryKey: ["slas", id],
    queryFn: () => slaApi.get(id),
    enabled: !!id,
  })
}

export function useCreateSLA() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SLACreate) => slaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slas"] })
    },
  })
}

export function useUpdateSLA() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SLAUpdate }) =>
      slaApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["slas"] })
      queryClient.invalidateQueries({ queryKey: ["slas", variables.id] })
    },
  })
}

export function useDeleteSLA() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => slaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slas"] })
    },
  })
}

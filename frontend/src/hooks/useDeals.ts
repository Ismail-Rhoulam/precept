import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { dealsApi } from "@/lib/api/deals"
import type { DealCreate, DealListParams } from "@/types/deal"

export function useDeals(params?: DealListParams) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: () => dealsApi.list(params),
  })
}

export function useDeal(id: number) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: () => dealsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DealCreate) => dealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealCreate> }) =>
      dealsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      queryClient.invalidateQueries({ queryKey: ["deals", variables.id] })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
    },
  })
}

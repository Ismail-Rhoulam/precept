import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { callLogsApi } from "@/lib/api/call-logs"
import type { CallLogCreate } from "@/types/call-log"

export function useCallLogs(params?: { entity_type?: string; entity_id?: number; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ["call-logs", params],
    queryFn: () => callLogsApi.list(params),
  })
}

export function useCallLog(id: number) {
  return useQuery({
    queryKey: ["call-logs", id],
    queryFn: () => callLogsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateCallLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CallLogCreate) => callLogsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useUpdateCallLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CallLogCreate> }) =>
      callLogsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] })
      queryClient.invalidateQueries({ queryKey: ["call-logs", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useDeleteCallLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => callLogsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

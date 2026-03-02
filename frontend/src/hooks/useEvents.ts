import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { eventsApi } from "@/lib/api/events"
import type { EventCreate, EventUpdate } from "@/types/event"

export function useEvents(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ["events", fromDate, toDate],
    queryFn: () => eventsApi.list(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  })
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventCreate) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventUpdate }) =>
      eventsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

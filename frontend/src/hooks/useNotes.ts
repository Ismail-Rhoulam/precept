import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notesApi } from "@/lib/api/notes"
import type { NoteCreate, NoteUpdate } from "@/types/note"

export function useNotes(params?: { entity_type?: string; entity_id?: number; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: () => notesApi.list(params),
  })
}

export function useNote(id: number) {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => notesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NoteCreate) => notesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NoteUpdate }) =>
      notesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["notes", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

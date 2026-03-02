import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fieldsLayoutApi } from "@/lib/api/fields-layout"
import type { FieldsLayoutCreate, FieldsLayoutUpdate } from "@/types/fields-layout"

export function useFieldsLayouts() {
  return useQuery({
    queryKey: ["fields-layout"],
    queryFn: () => fieldsLayoutApi.list(),
  })
}

export function useFieldsLayout(entityType: string, layoutType: string) {
  return useQuery({
    queryKey: ["fields-layout", entityType, layoutType],
    queryFn: () => fieldsLayoutApi.get(entityType, layoutType),
    enabled: !!entityType && !!layoutType,
    retry: false,
  })
}

export function useCreateFieldsLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FieldsLayoutCreate) => fieldsLayoutApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields-layout"] })
    },
  })
}

export function useUpdateFieldsLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FieldsLayoutUpdate }) =>
      fieldsLayoutApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields-layout"] })
    },
  })
}

export function useUpsertFieldsLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FieldsLayoutCreate) => fieldsLayoutApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields-layout"] })
    },
  })
}

export function useDeleteFieldsLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => fieldsLayoutApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields-layout"] })
    },
  })
}

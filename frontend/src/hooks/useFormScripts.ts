import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formScriptsApi } from "@/lib/api/form-scripts"
import type { FormScriptCreate, FormScriptUpdate } from "@/types/form-script"

export function useFormScripts() {
  return useQuery({
    queryKey: ["form-scripts"],
    queryFn: () => formScriptsApi.list(),
  })
}

export function useFormScript(id: number) {
  return useQuery({
    queryKey: ["form-scripts", id],
    queryFn: () => formScriptsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateFormScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormScriptCreate) => formScriptsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-scripts"] })
    },
  })
}

export function useUpdateFormScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormScriptUpdate }) =>
      formScriptsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["form-scripts"] })
      queryClient.invalidateQueries({ queryKey: ["form-scripts", variables.id] })
    },
  })
}

export function useDeleteFormScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => formScriptsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-scripts"] })
    },
  })
}

export function useToggleFormScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      formScriptsApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-scripts"] })
    },
  })
}

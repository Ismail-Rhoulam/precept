import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationsApi } from "@/lib/api/organizations"
import type { OrganizationCreate, OrganizationListParams } from "@/types/organization"

export function useOrganizations(params?: OrganizationListParams) {
  return useQuery({
    queryKey: ["organizations", params],
    queryFn: () => organizationsApi.list(params),
  })
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: ["organizations", id],
    queryFn: () => organizationsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OrganizationCreate) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OrganizationCreate> }) =>
      organizationsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      queryClient.invalidateQueries({ queryKey: ["organizations", variables.id] })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => organizationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })
}

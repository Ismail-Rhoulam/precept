import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsApi } from "@/lib/api/products"
import type { ProductCreate, ProductUpdate, LineItemCreate, ProductListParams } from "@/types/product"

// Product catalog hooks
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdate }) =>
      productsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

// Lead product line items
export function useLeadProducts(leadId: number) {
  return useQuery({
    queryKey: ["lead-products", leadId],
    queryFn: () => productsApi.listLeadProducts(leadId),
    enabled: !!leadId,
  })
}

export function useAddLeadProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: number; data: LineItemCreate }) =>
      productsApi.addLeadProduct(leadId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-products", variables.leadId] })
    },
  })
}

export function useRemoveLeadProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, productId }: { leadId: number; productId: number }) =>
      productsApi.removeLeadProduct(leadId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-products", variables.leadId] })
    },
  })
}

// Deal product line items
export function useDealProducts(dealId: number) {
  return useQuery({
    queryKey: ["deal-products", dealId],
    queryFn: () => productsApi.listDealProducts(dealId),
    enabled: !!dealId,
  })
}

export function useAddDealProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, data }: { dealId: number; data: LineItemCreate }) =>
      productsApi.addDealProduct(dealId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deal-products", variables.dealId] })
    },
  })
}

export function useRemoveDealProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, productId }: { dealId: number; productId: number }) =>
      productsApi.removeDealProduct(dealId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deal-products", variables.dealId] })
    },
  })
}

// Lead conversion
export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: number
      payload?: { deal_value?: number; expected_closure_date?: string; notes?: string }
    }) => productsApi.convertLeadToDeal(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: ["deals"] })
    },
  })
}

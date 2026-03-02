import { api } from "./client"
import type { Product, ProductCreate, ProductUpdate, LineItem, LineItemCreate, ProductListParams } from "@/types/product"
import type { PaginatedResponse } from "@/types/api"

export const productsApi = {
  // Product catalog CRUD
  list: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>("/crm/products/", {
      params: params as Record<string, string | number | boolean | undefined>,
    }),

  get: (id: number) =>
    api.get<Product>(`/crm/products/${id}`),

  create: (data: ProductCreate) =>
    api.post<Product>("/crm/products/", data),

  update: (id: number, data: ProductUpdate) =>
    api.patch<Product>(`/crm/products/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/products/${id}`),

  // Lead products
  listLeadProducts: (leadId: number) =>
    api.get<LineItem[]>(`/crm/leads/${leadId}/products`),

  addLeadProduct: (leadId: number, data: LineItemCreate) =>
    api.post<LineItem>(`/crm/leads/${leadId}/products`, data),

  removeLeadProduct: (leadId: number, productId: number) =>
    api.delete(`/crm/leads/${leadId}/products/${productId}`),

  // Deal products
  listDealProducts: (dealId: number) =>
    api.get<LineItem[]>(`/crm/deals/${dealId}/products`),

  addDealProduct: (dealId: number, data: LineItemCreate) =>
    api.post<LineItem>(`/crm/deals/${dealId}/products`, data),

  removeDealProduct: (dealId: number, productId: number) =>
    api.delete(`/crm/deals/${dealId}/products/${productId}`),

  // Lead conversion
  convertLeadToDeal: (leadId: number, payload?: { deal_value?: number; expected_closure_date?: string; notes?: string }) =>
    api.post<{ deal_id: number }>(`/crm/leads/${leadId}/convert`, payload),
}

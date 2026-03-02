import { api } from "./client"
import type { Contact, ContactCreate, ContactListParams } from "@/types/contact"
import type { PaginatedResponse } from "@/types/api"

export const contactsApi = {
  list: (params?: ContactListParams) =>
    api.get<PaginatedResponse<Contact>>("/crm/contacts/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Contact>(`/crm/contacts/${id}`),

  create: (data: ContactCreate) =>
    api.post<Contact>("/crm/contacts/", data),

  update: (id: number, data: Partial<ContactCreate>) =>
    api.patch<Contact>(`/crm/contacts/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/contacts/${id}`),

  bulkDelete: (ids: number[]) =>
    api.post("/crm/contacts/bulk-delete", { ids }),
}

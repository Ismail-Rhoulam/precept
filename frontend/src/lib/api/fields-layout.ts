import { api } from "./client"
import type { FieldsLayout, FieldsLayoutCreate, FieldsLayoutUpdate } from "@/types/fields-layout"

export const fieldsLayoutApi = {
  list: () => api.get<FieldsLayout[]>("/crm/fields-layout/"),

  get: (entityType: string, layoutType: string) =>
    api.get<FieldsLayout>("/crm/fields-layout/by-entity/", {
      params: { entity_type: entityType, layout_type: layoutType },
    }),

  create: (data: FieldsLayoutCreate) =>
    api.post<FieldsLayout>("/crm/fields-layout/", data),

  update: (id: number, data: FieldsLayoutUpdate) =>
    api.patch<FieldsLayout>(`/crm/fields-layout/${id}`, data),

  upsert: (data: FieldsLayoutCreate) =>
    api.post<FieldsLayout>("/crm/fields-layout/upsert/", data),

  delete: (id: number) => api.delete(`/crm/fields-layout/${id}`),
}

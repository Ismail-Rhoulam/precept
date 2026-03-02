import { api } from "./client"
import type { ViewSettings, ViewSettingsCreate } from "@/types/view"

export const viewsApi = {
  list: (entityType: string) =>
    api.get<ViewSettings[]>("/views/", {
      params: { entity_type: entityType },
    }),

  get: (id: number) =>
    api.get<ViewSettings>(`/views/${id}`),

  create: (data: ViewSettingsCreate) =>
    api.post<ViewSettings>("/views/", data),

  update: (id: number, data: Partial<ViewSettingsCreate>) =>
    api.patch<ViewSettings>(`/views/${id}`, data),

  delete: (id: number) =>
    api.delete(`/views/${id}`),

  setDefault: (id: number) =>
    api.post<ViewSettings>(`/views/${id}/set-default`),

  pin: (id: number) =>
    api.post<ViewSettings>(`/views/${id}/pin`),

  togglePublic: (id: number) =>
    api.post<ViewSettings>(`/views/${id}/toggle-public`),

  createOrUpdateStandard: (data: ViewSettingsCreate) =>
    api.post<ViewSettings>("/views/standard", data),
}

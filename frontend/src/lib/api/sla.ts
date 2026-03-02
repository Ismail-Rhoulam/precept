import { api } from "./client"
import type { SLA, SLACreate, SLAUpdate } from "@/types/sla"

export const slaApi = {
  list: () =>
    api.get<SLA[]>("/crm/sla/"),

  get: (id: number) =>
    api.get<SLA>(`/crm/sla/${id}`),

  create: (data: SLACreate) =>
    api.post<SLA>("/crm/sla/", data),

  update: (id: number, data: SLAUpdate) =>
    api.patch<SLA>(`/crm/sla/${id}`, data),

  delete: (id: number) =>
    api.delete(`/crm/sla/${id}`),
}

import { api } from "./client"
import type { FormScript, FormScriptCreate, FormScriptUpdate } from "@/types/form-script"

export const formScriptsApi = {
  list: () => api.get<FormScript[]>("/crm/form-scripts/"),

  get: (id: number) => api.get<FormScript>(`/crm/form-scripts/${id}`),

  create: (data: FormScriptCreate) =>
    api.post<FormScript>("/crm/form-scripts/", data),

  update: (id: number, data: FormScriptUpdate) =>
    api.patch<FormScript>(`/crm/form-scripts/${id}`, data),

  delete: (id: number) => api.delete(`/crm/form-scripts/${id}`),

  toggle: (id: number, enabled: boolean) =>
    api.patch<FormScript>(`/crm/form-scripts/${id}`, { enabled }),
}

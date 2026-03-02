import { api } from "./client"
import type { ImportableEntity, ImportPreview, ImportResult } from "@/types/data-import"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export const dataImportApi = {
  getEntities: () =>
    api.get<ImportableEntity[]>("/crm/data-import/entities/"),

  preview: async (file: File, entityType: string): Promise<ImportPreview> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("entity_type", entityType)

    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const response = await fetch(`${BASE_URL}/crm/data-import/preview/`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Preview failed" }))
      throw new Error(err.detail || `HTTP ${response.status}`)
    }
    return response.json()
  },

  importData: async (
    file: File,
    entityType: string,
    mapping: Record<string, string>
  ): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("entity_type", entityType)
    formData.append("mapping", JSON.stringify(mapping))

    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const response = await fetch(`${BASE_URL}/crm/data-import/import/`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Import failed" }))
      throw new Error(err.detail || `HTTP ${response.status}`)
    }
    return response.json()
  },

  getTemplate: (entityType: string) => {
    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    return fetch(
      `${BASE_URL}/crm/data-import/template/?entity_type=${encodeURIComponent(entityType)}`,
      { headers }
    ).then((r) => {
      if (!r.ok) throw new Error("Failed to get template")
      return r.blob()
    })
  },
}

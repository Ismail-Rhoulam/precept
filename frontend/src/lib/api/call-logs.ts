import { api } from "./client"
import type { CallLog, CallLogCreate } from "@/types/call-log"
import type { PaginatedResponse } from "@/types/api"

export const callLogsApi = {
  list: (params?: { entity_type?: string; entity_id?: number; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<CallLog>>("/comm/call-logs/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<CallLog>(`/comm/call-logs/${id}`),

  create: (data: CallLogCreate) =>
    api.post<CallLog>("/comm/call-logs/", data),

  update: (id: number, data: Partial<CallLogCreate>) =>
    api.patch<CallLog>(`/comm/call-logs/${id}`, data),

  delete: (id: number) =>
    api.delete(`/comm/call-logs/${id}`),
}

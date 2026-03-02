import { api } from "./client"
import type { Task, TaskCreate, TaskUpdate, TaskListParams } from "@/types/task"
import type { PaginatedResponse } from "@/types/api"

export const tasksApi = {
  list: (params?: TaskListParams) =>
    api.get<PaginatedResponse<Task>>("/comm/tasks/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Task>(`/comm/tasks/${id}`),

  create: (data: TaskCreate) =>
    api.post<Task>("/comm/tasks/", data),

  update: (id: number, data: TaskUpdate) =>
    api.patch<Task>(`/comm/tasks/${id}`, data),

  delete: (id: number) =>
    api.delete(`/comm/tasks/${id}`),
}

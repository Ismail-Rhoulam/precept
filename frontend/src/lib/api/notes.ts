import { api } from "./client"
import type { Note, NoteCreate, NoteUpdate } from "@/types/note"

export const notesApi = {
  list: (params?: { entity_type?: string; entity_id?: number; page?: number; page_size?: number }) =>
    api.get<{ results: Note[]; total: number }>("/comm/notes/", { params: params as Record<string, string | number | boolean | undefined> }),

  get: (id: number) =>
    api.get<Note>(`/comm/notes/${id}`),

  create: (data: NoteCreate) =>
    api.post<Note>("/comm/notes/", data),

  update: (id: number, data: NoteUpdate) =>
    api.patch<Note>(`/comm/notes/${id}`, data),

  delete: (id: number) =>
    api.delete(`/comm/notes/${id}`),
}

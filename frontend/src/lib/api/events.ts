import { api } from "./client"
import type { CalendarEvent, EventCreate, EventUpdate } from "@/types/event"

export const eventsApi = {
  list: (fromDate: string, toDate: string) =>
    api.get<CalendarEvent[]>("/crm/events/", {
      params: { from_date: fromDate, to_date: toDate },
    }),

  get: (id: number) => api.get<CalendarEvent>(`/crm/events/${id}`),

  create: (data: EventCreate) => api.post<CalendarEvent>("/crm/events/", data),

  update: (id: number, data: EventUpdate) =>
    api.patch<CalendarEvent>(`/crm/events/${id}`, data),

  delete: (id: number) => api.delete(`/crm/events/${id}`),

  rsvp: (id: number, attending: "Yes" | "No" | "Maybe") =>
    api.post<{ status: string }>(`/crm/events/${id}/rsvp`, { attending }),
}

"use client"

import { useState, useMemo } from "react"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { EventModal } from "@/components/calendar/EventModal"
import type { CalendarEvent, EventCreate } from "@/types/event"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

type ViewType = "month" | "week" | "day"

function getDateRange(date: Date, view: ViewType): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (view === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { from: fmt(start), to: fmt(end) }
  }
  if (view === "week") {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { from: fmt(start), to: fmt(end) }
  }
  // day
  return { from: fmt(date), to: fmt(date) }
}

function getTitle(date: Date, view: ViewType): string {
  if (view === "month") {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
  if (view === "week") {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}, ${date.getFullYear()}`
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function navigate(date: Date, view: ViewType, direction: -1 | 1): Date {
  const d = new Date(date)
  if (view === "month") {
    d.setMonth(d.getMonth() + direction)
    d.setDate(1)
  } else if (view === "week") {
    d.setDate(d.getDate() + direction * 7)
  } else {
    d.setDate(d.getDate() + direction)
  }
  return d
}

export default function CalendarPage() {
  const [viewType, setViewType] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { from, to } = useMemo(
    () => getDateRange(currentDate, viewType),
    [currentDate, viewType]
  )

  const { data: events = [], isLoading } = useEvents(from, to)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  function openCreate(date?: Date) {
    setSelectedEvent(null)
    setSelectedDate(date || new Date())
    setShowModal(true)
  }

  function openEdit(event: CalendarEvent) {
    setSelectedEvent(event)
    setSelectedDate(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  async function handleSave(data: EventCreate) {
    if (selectedEvent) {
      await updateEvent.mutateAsync({ id: selectedEvent.id, data })
    } else {
      await createEvent.mutateAsync(data)
    }
    closeModal()
  }

  async function handleDelete(id: number) {
    await deleteEvent.mutateAsync(id)
    closeModal()
  }

  useKeyboardShortcuts([
    {
      key: "n",
      action: () => openCreate(),
      description: "New event",
    },
  ])

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">Schedule and track your events</p>
          </div>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col" style={{ minHeight: "600px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate((d) => navigate(d, viewType, -1))}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900 min-w-[180px] text-center">
              {getTitle(currentDate, viewType)}
            </h2>
            <button
              onClick={() => setCurrentDate((d) => navigate(d, viewType, 1))}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                  viewType === v
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading events...
            </div>
          ) : (
            <CalendarGrid
              viewType={viewType}
              currentDate={currentDate}
              events={events}
              onDateClick={(date) => openCreate(date)}
              onEventClick={(event) => openEdit(event)}
            />
          )}
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          initialDate={selectedDate}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={selectedEvent ? handleDelete : undefined}
          isSaving={createEvent.isPending || updateEvent.isPending}
          isDeleting={deleteEvent.isPending}
        />
      )}
    </div>
  )
}

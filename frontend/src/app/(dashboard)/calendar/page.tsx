"use client"

import { useState, useMemo } from "react"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { EventModal } from "@/components/calendar/EventModal"
import type { CalendarEvent, EventCreate } from "@/types/event"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
            <p className="text-sm text-muted-foreground">Schedule and track your events</p>
          </div>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card className="overflow-hidden flex flex-col" style={{ minHeight: "600px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate((d) => navigate(d, viewType, -1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-semibold text-gray-900 min-w-[180px] text-center">
              {getTitle(currentDate, viewType)}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate((d) => navigate(d, viewType, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="ml-2"
            >
              Today
            </Button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(["month", "week", "day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                  viewType === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
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
      </Card>

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

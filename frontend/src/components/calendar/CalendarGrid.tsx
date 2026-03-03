"use client"

import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/types/event"
import { Badge } from "@/components/ui/badge"

type ViewType = "month" | "week" | "day"

interface CalendarGridProps {
  viewType: ViewType
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8am-8pm

function getEventColor(event: CalendarEvent): string {
  if (event.color) return event.color
  const entityColors: Record<string, string> = {
    lead: "#3b82f6",
    deal: "#8b5cf6",
    contact: "#10b981",
    organization: "#f59e0b",
  }
  return entityColors[event.entity_type?.toLowerCase()] || "#6366f1"
}

function EventPill({
  event,
  onClick,
}: {
  event: CalendarEvent
  onClick: (e: React.MouseEvent) => void
}) {
  const color = getEventColor(event)
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate mb-0.5 hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderLeft: `2px solid ${color}`,
      }}
      title={event.subject}
    >
      {event.all_day ? "" : formatEventTime(event.starts_on) + " "}
      {event.subject}
    </button>
  )
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? "pm" : "am"
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    const start = new Date(ev.starts_on)
    return isSameDay(start, day)
  })
}

function getEventsForHour(
  events: CalendarEvent[],
  day: Date,
  hour: number
): CalendarEvent[] {
  return events.filter((ev) => {
    const start = new Date(ev.starts_on)
    return isSameDay(start, day) && start.getHours() === hour
  })
}

// ---- Month View ----
function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: Omit<CalendarGridProps, "viewType">) {
  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of month, padded to start on Sunday
  const firstDay = new Date(year, month, 1)
  const startPad = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid cells
  const cells: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // Fill remaining cells to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
        {cells.map((date, idx) => {
          if (!date) {
            return (
              <div key={`empty-${idx}`} className="border-r border-b border-muted bg-muted/30" />
            )
          }
          const dayEvents = getEventsForDay(events, date)
          const isToday = isSameDay(date, today)
          const isCurrentMonth = date.getMonth() === month

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={cn(
                "border-r border-b border-muted p-1 cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px]",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1",
                  isToday
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventPill
                    key={ev.id}
                    event={ev}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(ev)
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    +{dayEvents.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Week View ----
function WeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: Omit<CalendarGridProps, "viewType">) {
  const today = new Date()
  // Get start of week (Sunday)
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
        <div className="py-2 text-xs text-muted-foreground text-center border-r border-muted" />
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className="py-2 text-center border-r border-muted last:border-r-0"
            >
              <div className="text-xs text-muted-foreground uppercase">
                {DAY_NAMES[day.getDay()]}
              </div>
              <div
                className={cn(
                  "mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="flex-1">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-muted">
            <div className="py-2 px-2 text-xs text-muted-foreground text-right border-r border-muted w-16">
              {hour % 12 || 12}
              {hour < 12 ? "am" : "pm"}
            </div>
            {weekDays.map((day) => {
              const hourEvents = getEventsForHour(events, day, hour)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    const d = new Date(day)
                    d.setHours(hour, 0, 0, 0)
                    onDateClick(d)
                  }}
                  className="min-h-[50px] border-r border-muted last:border-r-0 p-0.5 cursor-pointer hover:bg-muted/50 transition-colors relative"
                >
                  {hourEvents.map((ev) => (
                    <EventPill
                      key={ev.id}
                      event={ev}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Day View ----
function DayView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: Omit<CalendarGridProps, "viewType">) {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-center py-3 border-b">
        <span className="text-sm font-medium text-foreground">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Time slots */}
      <div className="flex-1">
        {HOURS.map((hour) => {
          const hourEvents = getEventsForHour(events, currentDate, hour)
          return (
            <div key={hour} className="flex border-b border-muted">
              <div className="py-2 px-3 text-xs text-muted-foreground text-right w-16 border-r border-muted">
                {hour % 12 || 12}
                {hour < 12 ? "am" : "pm"}
              </div>
              <div
                onClick={() => {
                  const d = new Date(currentDate)
                  d.setHours(hour, 0, 0, 0)
                  onDateClick(d)
                }}
                className="flex-1 min-h-[60px] p-1 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {hourEvents.map((ev) => (
                  <EventPill
                    key={ev.id}
                    event={ev}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(ev)
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Main CalendarGrid ----
export function CalendarGrid({
  viewType,
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  if (viewType === "month") {
    return (
      <MonthView
        currentDate={currentDate}
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    )
  }
  if (viewType === "week") {
    return (
      <WeekView
        currentDate={currentDate}
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    )
  }
  return (
    <DayView
      currentDate={currentDate}
      events={events}
      onDateClick={onDateClick}
      onEventClick={onEventClick}
    />
  )
}

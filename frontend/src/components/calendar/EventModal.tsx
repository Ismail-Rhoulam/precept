"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Loader2, MapPin, AlignLeft, Clock, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent, EventCreate } from "@/types/event"

const EVENT_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
]

function toLocalDateTimeString(dateStr: string): string {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toISO(localStr: string): string {
  return new Date(localStr).toISOString()
}

interface EventModalProps {
  event?: CalendarEvent | null
  initialDate?: Date | null
  onClose: () => void
  onSave: (data: EventCreate) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  isSaving?: boolean
  isDeleting?: boolean
}

export function EventModal({
  event,
  initialDate,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EventModalProps) {
  const isEditing = !!event

  const defaultStart = initialDate
    ? (() => {
        const d = new Date(initialDate)
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      })()
    : ""

  const [form, setForm] = useState<{
    subject: string
    description: string
    location: string
    starts_on: string
    ends_on: string
    all_day: boolean
    event_type: string
    color: string
    entity_type: string
    entity_id: string
    participantEmail: string
    participants: string[]
  }>({
    subject: event?.subject || "",
    description: event?.description || "",
    location: event?.location || "",
    starts_on: event ? toLocalDateTimeString(event.starts_on) : defaultStart,
    ends_on: event?.ends_on ? toLocalDateTimeString(event.ends_on) : "",
    all_day: event?.all_day ?? false,
    event_type: event?.event_type || "Private",
    color: event?.color || EVENT_COLORS[0],
    entity_type: event?.entity_type || "",
    entity_id: event?.entity_id ? String(event.entity_id) : "",
    participantEmail: "",
    participants: event?.participants?.map((p) => p.email) || [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function addParticipant() {
    const email = form.participantEmail.trim()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, participantEmail: "Invalid email" }))
      return
    }
    if (form.participants.includes(email)) {
      setErrors((prev) => ({ ...prev, participantEmail: "Already added" }))
      return
    }
    setForm((prev) => ({
      ...prev,
      participants: [...prev.participants, email],
      participantEmail: "",
    }))
  }

  function removeParticipant(email: string) {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.filter((e) => e !== email),
    }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.subject.trim()) errs.subject = "Subject is required"
    if (!form.starts_on) errs.starts_on = "Start date/time is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const data: EventCreate = {
      subject: form.subject.trim(),
      starts_on: toISO(form.starts_on),
      all_day: form.all_day,
      event_type: form.event_type,
      color: form.color,
    }
    if (form.description.trim()) data.description = form.description.trim()
    if (form.location.trim()) data.location = form.location.trim()
    if (form.ends_on) data.ends_on = toISO(form.ends_on)
    if (form.entity_type) data.entity_type = form.entity_type
    if (form.entity_id) data.entity_id = parseInt(form.entity_id, 10)
    if (form.participants.length > 0) {
      data.participants = form.participants.map((email) => ({ email }))
    }

    await onSave(data)
  }

  async function handleDelete() {
    if (event && onDelete) {
      await onDelete(event.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Event title"
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                errors.subject ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
            )}
          </div>

          {/* Date/Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Starts <span className="text-red-500">*</span>
              </label>
              <input
                type={form.all_day ? "date" : "datetime-local"}
                value={form.all_day ? form.starts_on.slice(0, 10) : form.starts_on}
                onChange={(e) => update("starts_on", e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.starts_on ? "border-red-300" : "border-gray-300"
                )}
              />
              {errors.starts_on && (
                <p className="mt-1 text-xs text-red-600">{errors.starts_on}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ends
              </label>
              <input
                type={form.all_day ? "date" : "datetime-local"}
                value={form.all_day ? form.ends_on.slice(0, 10) : form.ends_on}
                onChange={(e) => update("ends_on", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="all-day"
              type="checkbox"
              checked={form.all_day}
              onChange={(e) => update("all_day", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="all-day" className="text-sm text-gray-700">
              All day event
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlignLeft className="inline h-3.5 w-3.5 mr-1" />
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Add location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Event Type & Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={form.event_type}
                onChange={(e) => update("event_type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("color", c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      form.color === c ? "border-gray-800 scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Entity Link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <LinkIcon className="inline h-3.5 w-3.5 mr-1" />
                Related To
              </label>
              <select
                value={form.entity_type}
                onChange={(e) => update("entity_type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">None</option>
                <option value="lead">Lead</option>
                <option value="deal">Deal</option>
                <option value="contact">Contact</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            {form.entity_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID
                </label>
                <input
                  type="number"
                  value={form.entity_id}
                  onChange={(e) => update("entity_id", e.target.value)}
                  placeholder="Entity ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Participants
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.participantEmail}
                onChange={(e) => update("participantEmail", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addParticipant()
                  }
                }}
                placeholder="Add by email..."
                className={cn(
                  "flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.participantEmail ? "border-red-300" : "border-gray-300"
                )}
              />
              <button
                type="button"
                onClick={addParticipant}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {errors.participantEmail && (
              <p className="mt-1 text-xs text-red-600">{errors.participantEmail}</p>
            )}
            {form.participants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.participants.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeParticipant(email)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {isEditing && onDelete && (
                <>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600">Delete this event?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
                  isSaving
                    ? "bg-primary/70 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

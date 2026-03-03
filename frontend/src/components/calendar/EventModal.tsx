"use client"

import { useState } from "react"
import { Plus, Trash2, Loader2, MapPin, AlignLeft, Clock, Link as LinkIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent, EventCreate } from "@/types/event"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your event details below." : "Fill in the details for your new event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="event-subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-subject"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Event title"
              className={cn(errors.subject && "border-destructive")}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject}</p>
            )}
          </div>

          {/* Date/Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-starts">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Starts <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-starts"
                type={form.all_day ? "date" : "datetime-local"}
                value={form.all_day ? form.starts_on.slice(0, 10) : form.starts_on}
                onChange={(e) => update("starts_on", e.target.value)}
                className={cn(errors.starts_on && "border-destructive")}
              />
              {errors.starts_on && (
                <p className="text-xs text-destructive">{errors.starts_on}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-ends">Ends</Label>
              <Input
                id="event-ends"
                type={form.all_day ? "date" : "datetime-local"}
                value={form.all_day ? form.ends_on.slice(0, 10) : form.ends_on}
                onChange={(e) => update("ends_on", e.target.value)}
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
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <Label htmlFor="all-day" className="font-normal">
              All day event
            </Label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">
              <AlignLeft className="inline h-3.5 w-3.5 mr-1" />
              Description
            </Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add description..."
              rows={2}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Location
            </Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Add location"
            />
          </div>

          {/* Event Type & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.event_type} onValueChange={(val) => update("event_type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("color", c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Entity Link */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                <LinkIcon className="inline h-3.5 w-3.5 mr-1" />
                Related To
              </Label>
              <Select
                value={form.entity_type || "__none__"}
                onValueChange={(val) => update("entity_type", val === "__none__" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.entity_type && (
              <div className="space-y-2">
                <Label htmlFor="event-entity-id">ID</Label>
                <Input
                  id="event-entity-id"
                  type="number"
                  value={form.entity_id}
                  onChange={(e) => update("entity_id", e.target.value)}
                  placeholder="Entity ID"
                />
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex gap-2">
              <Input
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
                  "flex-1",
                  errors.participantEmail && "border-destructive"
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addParticipant}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.participantEmail && (
              <p className="text-xs text-destructive">{errors.participantEmail}</p>
            )}
            {form.participants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.participants.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeParticipant(email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <DialogFooter className="flex items-center justify-between pt-2 border-t sm:justify-between">
            <div>
              {isEditing && onDelete && (
                <>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-destructive">Delete this event?</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

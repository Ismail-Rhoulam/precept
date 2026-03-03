"use client"

import { useState } from "react"
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Inbox,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  useSLAs,
  useCreateSLA,
  useUpdateSLA,
  useDeleteSLA,
} from "@/hooks/useSLA"
import type { SLA, SLACreate, SLAUpdate } from "@/types/sla"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

function formatResponseTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

function parseResponseTime(hours: number, minutes: number): number {
  return hours * 3600 + minutes * 60
}

interface PriorityRow {
  priority: string
  hours: number
  minutes: number
}

interface WorkingHourRow {
  day: string
  start_time: string
  end_time: string
}

interface SLAFormData {
  sla_name: string
  apply_on: "Lead" | "Deal"
  enabled: boolean
  is_default: boolean
  condition: string
  condition_json: string
  start_date: string
  end_date: string
  priorities: PriorityRow[]
  working_hours: WorkingHourRow[]
}

function getDefaultFormData(): SLAFormData {
  return {
    sla_name: "",
    apply_on: "Lead",
    enabled: true,
    is_default: false,
    condition: "",
    condition_json: "{}",
    start_date: "",
    end_date: "",
    priorities: [{ priority: "High", hours: 1, minutes: 0 }],
    working_hours: [
      { day: "Monday", start_time: "09:00", end_time: "17:00" },
      { day: "Tuesday", start_time: "09:00", end_time: "17:00" },
      { day: "Wednesday", start_time: "09:00", end_time: "17:00" },
      { day: "Thursday", start_time: "09:00", end_time: "17:00" },
      { day: "Friday", start_time: "09:00", end_time: "17:00" },
    ],
  }
}

function slaToFormData(sla: SLA): SLAFormData {
  return {
    sla_name: sla.sla_name,
    apply_on: sla.apply_on,
    enabled: sla.enabled,
    is_default: sla.is_default,
    condition: sla.condition || "",
    condition_json: JSON.stringify(sla.condition_json || {}, null, 2),
    start_date: sla.start_date || "",
    end_date: sla.end_date || "",
    priorities: sla.priorities.map((p) => ({
      priority: p.priority,
      hours: Math.floor(p.response_time_seconds / 3600),
      minutes: Math.floor((p.response_time_seconds % 3600) / 60),
    })),
    working_hours: sla.working_hours.map((wh) => ({
      day: wh.day,
      start_time: wh.start_time,
      end_time: wh.end_time,
    })),
  }
}

function formDataToCreate(form: SLAFormData): SLACreate {
  let conditionJson: Record<string, any> = {}
  try {
    conditionJson = JSON.parse(form.condition_json)
  } catch {
    conditionJson = {}
  }

  return {
    sla_name: form.sla_name,
    apply_on: form.apply_on,
    enabled: form.enabled,
    is_default: form.is_default,
    condition: form.condition || undefined,
    condition_json: conditionJson,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    priorities: form.priorities.map((p) => ({
      priority: p.priority,
      response_time_seconds: parseResponseTime(p.hours, p.minutes),
    })),
    working_hours: form.working_hours.map((wh) => ({
      day: wh.day,
      start_time: wh.start_time,
      end_time: wh.end_time,
    })),
  }
}

interface SLAFormProps {
  form: SLAFormData
  onChange: (form: SLAFormData) => void
}

function SLAForm({ form, onChange }: SLAFormProps) {
  function updateField<K extends keyof SLAFormData>(key: K, value: SLAFormData[K]) {
    onChange({ ...form, [key]: value })
  }

  function addPriority() {
    updateField("priorities", [
      ...form.priorities,
      { priority: "", hours: 0, minutes: 30 },
    ])
  }

  function removePriority(index: number) {
    updateField(
      "priorities",
      form.priorities.filter((_, i) => i !== index)
    )
  }

  function updatePriority(index: number, field: keyof PriorityRow, value: string | number) {
    const updated = [...form.priorities]
    updated[index] = { ...updated[index], [field]: value }
    updateField("priorities", updated)
  }

  function addWorkingHour() {
    const usedDays = new Set(form.working_hours.map((wh) => wh.day))
    const nextDay = DAYS_OF_WEEK.find((d) => !usedDays.has(d)) || "Monday"
    updateField("working_hours", [
      ...form.working_hours,
      { day: nextDay, start_time: "09:00", end_time: "17:00" },
    ])
  }

  function removeWorkingHour(index: number) {
    updateField(
      "working_hours",
      form.working_hours.filter((_, i) => i !== index)
    )
  }

  function updateWorkingHour(index: number, field: keyof WorkingHourRow, value: string) {
    const updated = [...form.working_hours]
    updated[index] = { ...updated[index], [field]: value }
    updateField("working_hours", updated)
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SLA Name</Label>
          <Input
            type="text"
            value={form.sla_name}
            onChange={(e) => updateField("sla_name", e.target.value)}
            placeholder="e.g. Standard SLA"
          />
        </div>
        <div className="space-y-2">
          <Label>Apply On</Label>
          <select
            value={form.apply_on}
            onChange={(e) => updateField("apply_on", e.target.value as "Lead" | "Deal")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="Lead">Lead</option>
            <option value="Deal">Deal</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => updateField("enabled", !form.enabled)}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              form.enabled ? "bg-green-500" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                form.enabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm">Enabled</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => updateField("is_default", !form.is_default)}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              form.is_default ? "bg-blue-500" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                form.is_default ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm">Default</span>
        </label>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Start Date <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => updateField("start_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>
            End Date <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            type="date"
            value={form.end_date}
            onChange={(e) => updateField("end_date", e.target.value)}
          />
        </div>
      </div>

      {/* Priorities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">Priorities</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addPriority}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Priority
          </Button>
        </div>
        {form.priorities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No priorities defined.</p>
        ) : (
          <div className="space-y-2">
            {form.priorities.map((p, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-muted/50 border rounded-md px-3 py-2"
              >
                <Input
                  type="text"
                  value={p.priority}
                  onChange={(e) =>
                    updatePriority(index, "priority", e.target.value)
                  }
                  placeholder="Priority name"
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    value={p.hours}
                    onChange={(e) =>
                      updatePriority(
                        index,
                        "hours",
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="w-16 text-right"
                  />
                  <span className="text-xs text-muted-foreground">hrs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={p.minutes}
                    onChange={(e) =>
                      updatePriority(
                        index,
                        "minutes",
                        Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-16 text-right"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removePriority(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Working Hours */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">Working Hours</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addWorkingHour}
            disabled={form.working_hours.length >= 7}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Day
          </Button>
        </div>
        {form.working_hours.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No working hours defined.</p>
        ) : (
          <div className="space-y-2">
            {form.working_hours.map((wh, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-muted/50 border rounded-md px-3 py-2"
              >
                <select
                  value={wh.day}
                  onChange={(e) =>
                    updateWorkingHour(index, "day", e.target.value)
                  }
                  className="w-32 flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={wh.start_time}
                    onChange={(e) =>
                      updateWorkingHour(index, "start_time", e.target.value)
                    }
                    className="w-auto"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={wh.end_time}
                    onChange={(e) =>
                      updateWorkingHour(index, "end_time", e.target.value)
                    }
                    className="w-auto"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive ml-auto"
                  onClick={() => removeWorkingHour(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Condition JSON */}
      <div className="space-y-2">
        <Label>
          Condition JSON <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          value={form.condition_json}
          onChange={(e) => updateField("condition_json", e.target.value)}
          rows={4}
          className="font-mono resize-none"
          placeholder='{"field": "value"}'
        />
      </div>
    </div>
  )
}

interface SLACardProps {
  sla: SLA
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
}

function SLACard({ sla, isExpanded, onToggleExpand, onDelete }: SLACardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<SLAFormData>(slaToFormData(sla))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateSLA = useUpdateSLA()

  function handleStartEdit() {
    setForm(slaToFormData(sla))
    setErrorMessage(null)
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setForm(slaToFormData(sla))
    setErrorMessage(null)
    setIsEditing(false)
  }

  async function handleSave() {
    setErrorMessage(null)
    try {
      const data = formDataToCreate(form)
      await updateSLA.mutateAsync({ id: sla.id, data })
      setIsEditing(false)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update SLA."
      )
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* SLA Summary Row */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">
                {sla.sla_name}
              </h3>
              <Badge
                variant="secondary"
                className={cn(
                  sla.apply_on === "Lead"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                )}
              >
                {sla.apply_on}
              </Badge>
              {sla.is_default && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Default
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{sla.priorities.length} priorities</span>
              {sla.start_date && (
                <span>
                  {format(new Date(sla.start_date), "MMM d, yyyy")}
                  {sla.end_date &&
                    ` - ${format(new Date(sla.end_date), "MMM d, yyyy")}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn(
                sla.enabled
                  ? "bg-green-100 text-green-800"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {sla.enabled ? "Enabled" : "Disabled"}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t">
          {isEditing ? (
            <div className="p-6">
              <SLAForm form={form} onChange={setForm} />

              {errorMessage && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2 justify-end mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateSLA.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.sla_name.trim() || updateSLA.isPending}
                >
                  {updateSLA.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {updateSLA.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* View mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priorities */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Priorities
                  </h4>
                  {sla.priorities.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sla.priorities.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5"
                        >
                          <span className="text-sm font-medium">
                            {p.priority}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatResponseTime(p.response_time_seconds)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Working Hours */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Working Hours
                  </h4>
                  {sla.working_hours.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sla.working_hours.map((wh) => (
                        <div
                          key={wh.id}
                          className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5"
                        >
                          <span className="text-sm font-medium">
                            {wh.day}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {wh.start_time} - {wh.end_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Condition */}
              {sla.condition && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Condition
                  </h4>
                  <p className="text-sm">{sla.condition}</p>
                </div>
              )}

              {sla.condition_json &&
                Object.keys(sla.condition_json).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Condition JSON
                    </h4>
                    <pre className="text-xs text-muted-foreground bg-muted/50 border rounded p-3 overflow-x-auto">
                      {JSON.stringify(sla.condition_json, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartEdit()
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function SLASettingsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState<SLAFormData>(
    getDefaultFormData()
  )
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: slas, isLoading, isError } = useSLAs()
  const createSLA = useCreateSLA()
  const deleteSLA = useDeleteSLA()

  function handleToggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function handleStartCreate() {
    setCreateFormData(getDefaultFormData())
    setCreateError(null)
    setShowCreateForm(true)
  }

  function handleCancelCreate() {
    setShowCreateForm(false)
    setCreateFormData(getDefaultFormData())
    setCreateError(null)
  }

  async function handleCreate() {
    setCreateError(null)
    if (!createFormData.sla_name.trim()) return

    try {
      const data = formDataToCreate(createFormData)
      await createSLA.mutateAsync(data)
      setShowCreateForm(false)
      setCreateFormData(getDefaultFormData())
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create SLA."
      )
    }
  }

  async function handleDelete(sla: SLA) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${sla.sla_name}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteSLA.mutateAsync(sla.id)
      if (expandedId === sla.id) setExpandedId(null)
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              Service Level Agreements
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure SLA rules for leads and deals
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <Button onClick={handleStartCreate}>
            <Plus className="h-4 w-4" />
            New SLA
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Create New SLA
            </h3>

            <SLAForm form={createFormData} onChange={setCreateFormData} />

            {createError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 justify-end mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelCreate}
                disabled={createSLA.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!createFormData.sla_name.trim() || createSLA.isPending}
              >
                {createSLA.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {createSLA.isPending ? "Creating..." : "Create SLA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading SLAs...</span>
        </div>
      ) : isError ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive">
            Failed to load SLAs. Please try again.
          </p>
        </Card>
      ) : !slas || slas.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No SLAs configured yet. Create your first SLA to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {slas.map((sla) => (
            <SLACard
              key={sla.id}
              sla={sla}
              isExpanded={expandedId === sla.id}
              onToggleExpand={() => handleToggleExpand(sla.id)}
              onDelete={() => handleDelete(sla)}
            />
          ))}
        </div>
      )}

      {/* Delete error */}
      {deleteSLA.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {deleteSLA.error instanceof Error
              ? deleteSLA.error.message
              : "Failed to delete SLA."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SLA Name
          </label>
          <input
            type="text"
            value={form.sla_name}
            onChange={(e) => updateField("sla_name", e.target.value)}
            placeholder="e.g. Standard SLA"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apply On
          </label>
          <select
            value={form.apply_on}
            onChange={(e) => updateField("apply_on", e.target.value as "Lead" | "Deal")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              form.enabled ? "bg-green-500" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                form.enabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm text-gray-700">Enabled</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => updateField("is_default", !form.is_default)}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              form.is_default ? "bg-blue-500" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                form.is_default ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm text-gray-700">Default</span>
        </label>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => updateField("start_date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => updateField("end_date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Priorities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Priorities</h4>
          <button
            type="button"
            onClick={addPriority}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Priority
          </button>
        </div>
        {form.priorities.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No priorities defined.</p>
        ) : (
          <div className="space-y-2">
            {form.priorities.map((p, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
              >
                <input
                  type="text"
                  value={p.priority}
                  onChange={(e) =>
                    updatePriority(index, "priority", e.target.value)
                  }
                  placeholder="Priority name"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <div className="flex items-center gap-1">
                  <input
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
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-xs text-gray-500">hrs</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
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
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePriority(index)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Working Hours */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Working Hours</h4>
          <button
            type="button"
            onClick={addWorkingHour}
            disabled={form.working_hours.length >= 7}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium transition-colors",
              form.working_hours.length >= 7
                ? "text-gray-300 cursor-not-allowed"
                : "text-primary hover:text-primary/80"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Day
          </button>
        </div>
        {form.working_hours.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No working hours defined.</p>
        ) : (
          <div className="space-y-2">
            {form.working_hours.map((wh, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
              >
                <select
                  value={wh.day}
                  onChange={(e) =>
                    updateWorkingHour(index, "day", e.target.value)
                  }
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={wh.start_time}
                    onChange={(e) =>
                      updateWorkingHour(index, "start_time", e.target.value)
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="time"
                    value={wh.end_time}
                    onChange={(e) =>
                      updateWorkingHour(index, "end_time", e.target.value)
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWorkingHour(index)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Condition JSON */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition JSON <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.condition_json}
          onChange={(e) => updateField("condition_json", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* SLA Summary Row */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {sla.sla_name}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  sla.apply_on === "Lead"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                )}
              >
                {sla.apply_on}
              </span>
              {sla.is_default && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                sla.enabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {sla.enabled ? "Enabled" : "Disabled"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {isEditing ? (
            <div className="p-6">
              <SLAForm form={form} onChange={setForm} />

              {errorMessage && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <div className="flex items-center gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCancelEdit}
                  disabled={updateSLA.isPending}
                  className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.sla_name.trim() || updateSLA.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    !form.sla_name.trim() || updateSLA.isPending
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {updateSLA.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {updateSLA.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* View mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priorities */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Priorities
                  </h4>
                  {sla.priorities.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sla.priorities.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5"
                        >
                          <span className="text-sm text-gray-900 font-medium">
                            {p.priority}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
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
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Working Hours
                  </h4>
                  {sla.working_hours.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sla.working_hours.map((wh) => (
                        <div
                          key={wh.id}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5"
                        >
                          <span className="text-sm text-gray-900 font-medium">
                            {wh.day}
                          </span>
                          <span className="text-sm text-gray-600">
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
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Condition
                  </h4>
                  <p className="text-sm text-gray-700">{sla.condition}</p>
                </div>
              )}

              {sla.condition_json &&
                Object.keys(sla.condition_json).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Condition JSON
                    </h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
                      {JSON.stringify(sla.condition_json, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartEdit()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
            <h1 className="text-2xl font-bold text-gray-900">
              Service Level Agreements
            </h1>
            <p className="text-sm text-gray-500">
              Configure SLA rules for leads and deals
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New SLA
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New SLA
          </h3>

          <SLAForm form={createFormData} onChange={setCreateFormData} />

          {createError && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{createError}</p>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleCancelCreate}
              disabled={createSLA.isPending}
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!createFormData.sla_name.trim() || createSLA.isPending}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                !createFormData.sla_name.trim() || createSLA.isPending
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {createSLA.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createSLA.isPending ? "Creating..." : "Create SLA"}
            </button>
          </div>
        </div>
      )}

      {/* SLA List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading SLAs...</span>
        </div>
      ) : isError ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600">
            Failed to load SLAs. Please try again.
          </p>
        </div>
      ) : !slas || slas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No SLAs configured yet. Create your first SLA to get started.
          </p>
        </div>
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
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            {deleteSLA.error instanceof Error
              ? deleteSLA.error.message
              : "Failed to delete SLA."}
          </p>
        </div>
      )}
    </div>
  )
}

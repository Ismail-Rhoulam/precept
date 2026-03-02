"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Facebook,
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  Inbox,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSyncSources,
  useCreateSyncSource,
  useUpdateSyncSource,
  useDeleteSyncSource,
  useTriggerSync,
} from "@/hooks/useIntegrations"
import { integrationsApi } from "@/lib/api/integrations"
import type { LeadSyncSource, FacebookPage, FacebookForm } from "@/types/integration"

const CRM_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "mobile_no",
  "company_name",
  "designation",
  "city",
  "state",
  "country",
  "source",
  "notes",
]

const SYNC_FREQUENCIES = [
  { value: "15min", label: "Every 15 minutes" },
  { value: "30min", label: "Every 30 minutes" },
  { value: "1hour", label: "Every hour" },
  { value: "6hours", label: "Every 6 hours" },
  { value: "daily", label: "Daily" },
  { value: "manual", label: "Manual only" },
]

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

interface SyncSourceFormData {
  name: string
  facebook_page_id: string
  facebook_page_name: string
  facebook_form_id: string
  facebook_form_name: string
  field_mapping: Record<string, string>
  sync_frequency: string
  enabled: boolean
}

interface SyncSourceModalProps {
  source?: LeadSyncSource | null
  onClose: () => void
}

function SyncSourceModal({ source, onClose }: SyncSourceModalProps) {
  const isEditing = !!source

  const [form, setForm] = useState<SyncSourceFormData>({
    name: source?.name || "",
    facebook_page_id: source?.facebook_page_id || "",
    facebook_page_name: source?.facebook_page_name || "",
    facebook_form_id: source?.facebook_form_id || "",
    facebook_form_name: source?.facebook_form_name || "",
    field_mapping: source?.field_mapping || {},
    sync_frequency: source?.sync_frequency || "1hour",
    enabled: source?.enabled ?? true,
  })

  const [accessToken, setAccessToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [forms, setForms] = useState<FacebookForm[]>([])
  const [fetchingPages, setFetchingPages] = useState(false)
  const [fetchingForms, setFetchingForms] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Field mapping: track which Facebook fields to map
  const [fbFields, setFbFields] = useState<string[]>(
    Object.keys(source?.field_mapping || {})
  )
  const [newFbField, setNewFbField] = useState("")

  const createSyncSource = useCreateSyncSource()
  const updateSyncSource = useUpdateSyncSource()

  async function handleFetchPages() {
    if (!accessToken.trim()) return
    setFetchingPages(true)
    setErrorMessage(null)
    try {
      const result = await integrationsApi.fetchFacebookPages(accessToken)
      setPages(result)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch pages."
      )
    } finally {
      setFetchingPages(false)
    }
  }

  async function handleFetchForms() {
    if (!form.facebook_page_id || !accessToken.trim()) return
    setFetchingForms(true)
    setErrorMessage(null)
    try {
      const result = await integrationsApi.fetchFacebookForms(
        form.facebook_page_id,
        accessToken
      )
      setForms(result)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch forms."
      )
    } finally {
      setFetchingForms(false)
    }
  }

  function handlePageChange(pageId: string) {
    const page = pages.find((p) => p.id === pageId)
    setForm((prev) => ({
      ...prev,
      facebook_page_id: pageId,
      facebook_page_name: page?.name || "",
      facebook_form_id: "",
      facebook_form_name: "",
    }))
    setForms([])
  }

  function handleFormChange(formId: string) {
    const fbForm = forms.find((f) => f.id === formId)
    setForm((prev) => ({
      ...prev,
      facebook_form_id: formId,
      facebook_form_name: fbForm?.name || "",
    }))
  }

  function addFieldMapping() {
    if (!newFbField.trim() || fbFields.includes(newFbField.trim())) return
    const field = newFbField.trim()
    setFbFields((prev) => [...prev, field])
    setForm((prev) => ({
      ...prev,
      field_mapping: { ...prev.field_mapping, [field]: "" },
    }))
    setNewFbField("")
  }

  function removeFieldMapping(fbField: string) {
    setFbFields((prev) => prev.filter((f) => f !== fbField))
    setForm((prev) => {
      const mapping = { ...prev.field_mapping }
      delete mapping[fbField]
      return { ...prev, field_mapping: mapping }
    })
  }

  function updateFieldMapping(fbField: string, crmField: string) {
    setForm((prev) => ({
      ...prev,
      field_mapping: { ...prev.field_mapping, [fbField]: crmField },
    }))
  }

  async function handleSave() {
    setErrorMessage(null)
    if (!form.name.trim()) {
      setErrorMessage("Name is required.")
      return
    }

    try {
      if (isEditing && source) {
        await updateSyncSource.mutateAsync({ id: source.id, data: form })
      } else {
        await createSyncSource.mutateAsync(form)
      }
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save sync source."
      )
    }
  }

  const isSaving = createSyncSource.isPending || updateSyncSource.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Sync Source" : "Add Sync Source"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Website Lead Ads"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Access Token + Fetch Pages */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Access Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? "text" : "password"}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Paste your Facebook access token"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleFetchPages}
                  disabled={!accessToken.trim() || fetchingPages}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                    !accessToken.trim() || fetchingPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {fetchingPages && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Fetch Pages
                </button>
              </div>
            </div>
          )}

          {/* Page Dropdown */}
          {pages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Page
              </label>
              <select
                value={form.facebook_page_id}
                onChange={(e) => handlePageChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select a page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fetch Forms button (after page is selected) */}
          {form.facebook_page_id && !isEditing && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFetchForms}
                disabled={fetchingForms}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  fetchingForms
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                )}
              >
                {fetchingForms && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Fetch Forms
              </button>
            </div>
          )}

          {/* Form Dropdown */}
          {forms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Form
              </label>
              <select
                value={form.facebook_form_id}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">Select a form</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Display selected page/form for editing */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Page
                </label>
                <input
                  type="text"
                  value={form.facebook_page_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Form
                </label>
                <input
                  type="text"
                  value={form.facebook_form_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          )}

          {/* Field Mapping */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Mapping
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Map Facebook form fields to CRM lead fields
            </p>

            {fbFields.length > 0 && (
              <div className="border border-gray-200 rounded-md overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                        Facebook Field
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                        CRM Field
                      </th>
                      <th className="w-10 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fbFields.map((fbField) => (
                      <tr key={fbField}>
                        <td className="px-3 py-2 text-gray-700 font-mono text-xs">
                          {fbField}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={form.field_mapping[fbField] || ""}
                            onChange={(e) =>
                              updateFieldMapping(fbField, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                          >
                            <option value="">-- Select --</option>
                            {CRM_FIELDS.map((crmField) => (
                              <option key={crmField} value={crmField}>
                                {crmField}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeFieldMapping(fbField)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newFbField}
                onChange={(e) => setNewFbField(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFieldMapping()
                  }
                }}
                placeholder="Facebook field name (e.g. full_name)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={addFieldMapping}
                disabled={!newFbField.trim()}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  !newFbField.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                )}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Sync Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Frequency
            </label>
            <select
              value={form.sync_frequency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sync_frequency: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              {SYNC_FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Enabled
            </label>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                form.enabled ? "bg-primary" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  form.enabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              isSaving
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Save Changes" : "Create Source"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FacebookSyncPage() {
  const { data: sources, isLoading, isError } = useSyncSources()
  const deleteSyncSource = useDeleteSyncSource()
  const triggerSync = useTriggerSync()
  const updateSyncSource = useUpdateSyncSource()

  const [showModal, setShowModal] = useState(false)
  const [editingSource, setEditingSource] = useState<LeadSyncSource | null>(null)
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set())

  async function handleTriggerSync(id: number) {
    setSyncingIds((prev) => new Set(prev).add(id))
    try {
      await triggerSync.mutateAsync(id)
    } catch {
      // Error surfaced via mutation state
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleToggleEnabled(source: LeadSyncSource) {
    try {
      await updateSyncSource.mutateAsync({
        id: source.id,
        data: { enabled: !source.enabled },
      })
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleDelete(source: LeadSyncSource) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${source.name}"? This action cannot be undone.`
    )
    if (!confirmed) return
    try {
      await deleteSyncSource.mutateAsync(source.id)
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Facebook className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Facebook Lead Sync
              </h1>
              <p className="text-sm text-gray-500">
                Sync leads from Facebook Lead Ads into your CRM
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingSource(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Sync Source
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading sync sources...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">
              Failed to load sync sources. Please try again.
            </p>
          </div>
        ) : !sources || sources.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No sync sources configured. Add one to start syncing leads from
              Facebook.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Page
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Form
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Frequency
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Last Synced
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((source) => (
                  <tr
                    key={source.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {source.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {source.facebook_page_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {source.facebook_form_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {SYNC_FREQUENCIES.find(
                        (f) => f.value === source.sync_frequency
                      )?.label || source.sync_frequency}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatRelativeTime(source.last_synced_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleEnabled(source)}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                          source.enabled
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {source.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleTriggerSync(source.id)}
                          disabled={syncingIds.has(source.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                          title="Sync now"
                        >
                          <RefreshCw
                            className={cn(
                              "h-3.5 w-3.5",
                              syncingIds.has(source.id) && "animate-spin"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSource(source)
                            setShowModal(true)
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(source)}
                          disabled={deleteSyncSource.isPending}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error display for mutations */}
      {(deleteSyncSource.isError || triggerSync.isError) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            {deleteSyncSource.error instanceof Error
              ? deleteSyncSource.error.message
              : triggerSync.error instanceof Error
                ? triggerSync.error.message
                : "An error occurred."}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SyncSourceModal
          source={editingSource}
          onClose={() => {
            setShowModal(false)
            setEditingSource(null)
          }}
        />
      )}
    </div>
  )
}

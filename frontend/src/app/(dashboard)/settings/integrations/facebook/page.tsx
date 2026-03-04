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
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Sync Source" : "Add Sync Source"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto flex-1 px-1">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Website Lead Ads"
            />
          </div>

          {/* Access Token + Fetch Pages */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Facebook Access Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Paste your Facebook access token"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={handleFetchPages}
                  disabled={!accessToken.trim() || fetchingPages}
                >
                  {fetchingPages && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Fetch Pages
                </Button>
              </div>
            </div>
          )}

          {/* Page Dropdown */}
          {pages.length > 0 && (
            <div className="space-y-2">
              <Label>Facebook Page</Label>
              <select
                value={form.facebook_page_id}
                onChange={(e) => handlePageChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchForms}
                disabled={fetchingForms}
              >
                {fetchingForms && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Fetch Forms
              </Button>
            </div>
          )}

          {/* Form Dropdown */}
          {forms.length > 0 && (
            <div className="space-y-2">
              <Label>Lead Form</Label>
              <select
                value={form.facebook_form_id}
                onChange={(e) => handleFormChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <div className="space-y-2">
                <Label>Facebook Page</Label>
                <Input
                  type="text"
                  value={form.facebook_page_name}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>Lead Form</Label>
                <Input
                  type="text"
                  value={form.facebook_form_name}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Field Mapping */}
          <div className="space-y-2">
            <Label>Field Mapping</Label>
            <p className="text-xs text-muted-foreground">
              Map Facebook form fields to CRM lead fields
            </p>

            {fbFields.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">
                      Facebook Field
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase">
                      CRM Field
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fbFields.map((fbField) => (
                    <TableRow key={fbField}>
                      <TableCell className="font-mono text-xs">
                        {fbField}
                      </TableCell>
                      <TableCell>
                        <select
                          value={form.field_mapping[fbField] || ""}
                          onChange={(e) =>
                            updateFieldMapping(fbField, e.target.value)
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- Select --</option>
                          {CRM_FIELDS.map((crmField) => (
                            <option key={crmField} value={crmField}>
                              {crmField}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => removeFieldMapping(fbField)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex gap-2">
              <Input
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
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addFieldMapping}
                disabled={!newFbField.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Sync Frequency */}
          <div className="space-y-2">
            <Label>Sync Frequency</Label>
            <select
              value={form.sync_frequency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sync_frequency: e.target.value,
                }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <Label>Enabled</Label>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                form.enabled ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                  form.enabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Error */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Facebook className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                Facebook Lead Sync
              </h1>
              <p className="text-sm text-muted-foreground">
                Sync leads from Facebook Lead Ads into your CRM
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingSource(null)
              setShowModal(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Sync Source
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading sync sources...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm text-destructive">
              Failed to load sync sources. Please try again.
            </p>
          </div>
        ) : !sources || sources.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No sync sources configured. Add one to start syncing leads from
              Facebook.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Page
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Form
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Frequency
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Last Synced
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-center">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">
                    {source.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.facebook_page_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.facebook_form_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {SYNC_FREQUENCIES.find(
                      (f) => f.value === source.sync_frequency
                    )?.label || source.sync_frequency}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatRelativeTime(source.last_synced_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => handleToggleEnabled(source)}>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "cursor-pointer",
                          source.enabled
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {source.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleTriggerSync(source.id)}
                        disabled={syncingIds.has(source.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
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
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(source)}
                        disabled={deleteSyncSource.isPending}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Error display for mutations */}
      {(deleteSyncSource.isError || triggerSync.isError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {deleteSyncSource.error instanceof Error
              ? deleteSyncSource.error.message
              : triggerSync.error instanceof Error
                ? triggerSync.error.message
                : "An error occurred."}
          </AlertDescription>
        </Alert>
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

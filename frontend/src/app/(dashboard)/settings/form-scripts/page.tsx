"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code2,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useFormScripts,
  useCreateFormScript,
  useUpdateFormScript,
  useDeleteFormScript,
  useToggleFormScript,
} from "@/hooks/useFormScripts"
import type { FormScript, FormScriptCreate } from "@/types/form-script"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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

const ENTITY_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Deal" },
  { value: "contact", label: "Contact" },
  { value: "organization", label: "Organization" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
]

const DEFAULT_SCRIPT = `// Form Script
// Available context:
//   frm    - the form object
//   doc    - the current document data
//   events - register event handlers

frm.on("load", function() {
  // Runs when form loads
})

frm.on("submit", function() {
  // Runs before form submit
  // return false to cancel
})
`

interface ScriptEditorProps {
  script?: FormScript | null
  onClose: () => void
}

function ScriptEditor({ script, onClose }: ScriptEditorProps) {
  const isEditing = !!script
  const createScript = useCreateFormScript()
  const updateScript = useUpdateFormScript()

  const [form, setForm] = useState<FormScriptCreate>({
    name: script?.name || "",
    entity_type: script?.entity_type || "lead",
    script: script?.script || DEFAULT_SCRIPT,
    enabled: script?.enabled ?? true,
    description: script?.description || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.script.trim()) errs.script = "Script cannot be empty"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (isEditing && script) {
      await updateScript.mutateAsync({ id: script.id, data: form })
    } else {
      await createScript.mutateAsync(form)
    }
    onClose()
  }

  const isSaving = createScript.isPending || updateScript.isPending

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Form Script" : "New Form Script"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 px-1">
            {/* Name */}
            <div className="space-y-2">
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Lead Validation Script"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Entity type & enabled */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <select
                  value={form.entity_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, entity_type: e.target.value }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                  className={cn(
                    "w-full justify-start gap-2",
                    form.enabled
                      ? "border-green-300 bg-green-50 text-green-700"
                      : ""
                  )}
                >
                  {form.enabled ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  {form.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of what this script does"
              />
            </div>

            {/* Script editor */}
            <div className="space-y-2">
              <Label>
                Script <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={form.script}
                onChange={(e) =>
                  setForm((p) => ({ ...p, script: e.target.value }))
                }
                rows={16}
                spellCheck={false}
                className={cn(
                  "font-mono resize-y bg-gray-950 text-green-400",
                  errors.script ? "border-destructive" : ""
                )}
                style={{ fontFamily: "monospace", tabSize: 2 }}
              />
              {errors.script && (
                <p className="text-xs text-destructive">{errors.script}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
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
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Script"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ScriptRow({ script }: { script: FormScript }) {
  const deleteScript = useDeleteFormScript()
  const toggleScript = useToggleFormScript()
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="text-sm font-medium">{script.name}</div>
          {script.description && (
            <div className="text-xs text-muted-foreground mt-0.5">{script.description}</div>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="capitalize">
            {script.entity_type}
          </Badge>
        </TableCell>
        <TableCell>
          <button
            onClick={() =>
              toggleScript.mutate({ id: script.id, enabled: !script.enabled })
            }
            disabled={toggleScript.isPending}
          >
            <Badge
              variant="secondary"
              className={cn(
                "cursor-pointer",
                script.enabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {script.enabled ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              {script.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </button>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {new Date(script.updated_at || script.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditor(true)}
            >
              Edit
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteScript.mutate(script.id)}
                  disabled={deleteScript.isPending}
                >
                  {deleteScript.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {showEditor && (
        <ScriptEditor script={script} onClose={() => setShowEditor(false)} />
      )}
    </>
  )
}

export default function FormScriptsPage() {
  const { data: scripts = [], isLoading, isError } = useFormScripts()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Code2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Form Scripts</h1>
            <p className="text-sm text-muted-foreground">
              Customize form behavior with JavaScript scripts
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Script
          </Button>
        </div>
      </div>

      {/* Scripts table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading scripts...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm">Failed to load form scripts</p>
          </div>
        ) : scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Code2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold mb-1">
              No form scripts yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Form scripts let you add custom JavaScript behavior to your CRM
              forms.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create First Script
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Entity
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Updated
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scripts.map((script) => (
                <ScriptRow key={script.id} script={script} />
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showCreate && <ScriptEditor onClose={() => setShowCreate(false)} />}
    </div>
  )
}

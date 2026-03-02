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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Form Script" : "New Form Script"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Lead Validation Script"
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.name ? "border-red-300" : "border-gray-300"
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Entity type & enabled */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <select
                  value={form.entity_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, entity_type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors",
                    form.enabled
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-gray-300 bg-gray-50 text-gray-600"
                  )}
                >
                  {form.enabled ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  {form.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of what this script does"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Script editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.script}
                onChange={(e) =>
                  setForm((p) => ({ ...p, script: e.target.value }))
                }
                rows={16}
                spellCheck={false}
                className={cn(
                  "w-full px-3 py-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y bg-gray-950 text-green-400",
                  errors.script ? "border-red-300" : "border-gray-300"
                )}
                style={{ fontFamily: "monospace", tabSize: 2 }}
              />
              {errors.script && (
                <p className="mt-1 text-xs text-red-600">{errors.script}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
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
                isSaving ? "bg-primary/70 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
              )}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Script"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ScriptRow({ script }: { script: FormScript }) {
  const deleteScript = useDeleteFormScript()
  const toggleScript = useToggleFormScript()
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-900">{script.name}</div>
          {script.description && (
            <div className="text-xs text-gray-500 mt-0.5">{script.description}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
            {script.entity_type}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() =>
              toggleScript.mutate({ id: script.id, enabled: !script.enabled })
            }
            disabled={toggleScript.isPending}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              script.enabled
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {script.enabled ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {script.enabled ? "Enabled" : "Disabled"}
          </button>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(script.updated_at || script.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEditor(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
            >
              Edit
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteScript.mutate(script.id)}
                  disabled={deleteScript.isPending}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteScript.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>

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
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Code2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Scripts</h1>
            <p className="text-sm text-gray-500">
              Customize form behavior with JavaScript scripts
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Script
          </button>
        </div>
      </div>

      {/* Scripts table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading scripts...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <AlertCircle className="h-8 w-8 text-gray-300" />
            <p className="text-sm">Failed to load form scripts</p>
          </div>
        ) : scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Code2 className="h-10 w-10 text-gray-200 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No form scripts yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Form scripts let you add custom JavaScript behavior to your CRM
              forms.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Script
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scripts.map((script) => (
                  <ScriptRow key={script.id} script={script} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <ScriptEditor onClose={() => setShowCreate(false)} />}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LayoutTemplate,
  ChevronLeft,
  Loader2,
  Save,
  AlertCircle,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFieldsLayout, useUpsertFieldsLayout } from "@/hooks/useFieldsLayout"

const ENTITY_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Deal" },
  { value: "contact", label: "Contact" },
  { value: "organization", label: "Organization" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
]

const LAYOUT_TYPES = [
  { value: "detail", label: "Detail View" },
  { value: "form", label: "Create/Edit Form" },
  { value: "list_columns", label: "List Columns" },
  { value: "card", label: "Card View" },
]

const DEFAULT_LAYOUTS: Record<string, Record<string, unknown>> = {
  detail: {
    sections: [
      {
        label: "Basic Information",
        columns: 2,
        fields: ["first_name", "last_name", "email", "phone"],
      },
      {
        label: "Additional Details",
        columns: 2,
        fields: ["status", "source", "organization"],
      },
    ],
  },
  form: {
    sections: [
      {
        label: "Required Fields",
        columns: 2,
        fields: ["first_name", "last_name", "email"],
      },
    ],
  },
  list_columns: {
    columns: ["name", "email", "status", "created_at"],
  },
  card: {
    title_field: "name",
    subtitle_field: "email",
    badge_field: "status",
    fields: ["organization", "phone"],
  },
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export default function FieldsLayoutPage() {
  const [entityType, setEntityType] = useState("lead")
  const [layoutType, setLayoutType] = useState("detail")
  const [layoutJson, setLayoutJson] = useState("")
  const [jsonError, setJsonError] = useState("")
  const [saved, setSaved] = useState(false)

  const { data: existingLayout, isLoading } = useFieldsLayout(entityType, layoutType)
  const upsert = useUpsertFieldsLayout()

  // Load existing layout or set default
  useEffect(() => {
    if (existingLayout?.layout) {
      setLayoutJson(JSON.stringify(existingLayout.layout, null, 2))
    } else {
      const def = DEFAULT_LAYOUTS[layoutType] || {}
      setLayoutJson(JSON.stringify(def, null, 2))
    }
    setJsonError("")
    setSaved(false)
  }, [existingLayout, entityType, layoutType])

  function handleJsonChange(val: string) {
    setLayoutJson(val)
    setSaved(false)
    if (!isValidJSON(val)) {
      setJsonError("Invalid JSON syntax")
    } else {
      setJsonError("")
    }
  }

  async function handleSave() {
    if (!isValidJSON(layoutJson)) {
      setJsonError("Please fix JSON errors before saving")
      return
    }

    const layout = JSON.parse(layoutJson)
    await upsert.mutateAsync({ entity_type: entityType, layout_type: layoutType, layout })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleLoadDefault() {
    const def = DEFAULT_LAYOUTS[layoutType] || {}
    setLayoutJson(JSON.stringify(def, null, 2))
    setJsonError("")
    setSaved(false)
  }

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
          <LayoutTemplate className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fields Layout</h1>
            <p className="text-sm text-gray-500">
              Configure how fields are displayed in forms and views
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selectors */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Configuration</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
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
                Layout Type
              </label>
              <div className="space-y-1.5">
                {LAYOUT_TYPES.map((lt) => (
                  <button
                    key={lt.value}
                    onClick={() => setLayoutType(lt.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
                      layoutType === lt.value
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {lt.label}
                    {layoutType === lt.value && (
                      <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}

            {existingLayout ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-md px-2.5 py-1.5">
                <Check className="h-3.5 w-3.5" />
                Layout configured
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                No custom layout — using defaults
              </div>
            )}
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
              JSON Structure
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                <strong>sections</strong> — array of section objects
              </li>
              <li>
                <strong>label</strong> — section heading
              </li>
              <li>
                <strong>columns</strong> — 1, 2, or 3
              </li>
              <li>
                <strong>fields</strong> — array of field names
              </li>
            </ul>
          </div>
        </div>

        {/* Right: JSON Editor */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Layout JSON
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadDefault}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
              >
                Load Default
              </button>
              <button
                onClick={handleSave}
                disabled={upsert.isPending || !!jsonError}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors",
                  upsert.isPending || jsonError
                    ? "bg-primary/50 cursor-not-allowed"
                    : saved
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {upsert.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {upsert.isPending ? "Saving..." : saved ? "Saved!" : "Save Layout"}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={layoutJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={24}
              spellCheck={false}
              className={cn(
                "w-full px-4 py-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y bg-gray-950 text-green-300",
                jsonError ? "border-red-300" : "border-gray-300"
              )}
              style={{ fontFamily: "monospace", tabSize: 2, lineHeight: 1.6 }}
            />
          </div>

          {jsonError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {jsonError}
            </div>
          )}

          {upsert.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {upsert.error instanceof Error
                ? upsert.error.message
                : "Failed to save layout"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

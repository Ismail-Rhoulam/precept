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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Fields Layout</h1>
            <p className="text-sm text-muted-foreground">
              Configure how fields are displayed in forms and views
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selectors */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-sm font-semibold">Configuration</h2>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Layout Type</Label>
                <div className="space-y-1.5">
                  {LAYOUT_TYPES.map((lt) => (
                    <Button
                      key={lt.value}
                      variant={layoutType === lt.value ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => setLayoutType(lt.value)}
                    >
                      {lt.label}
                      {layoutType === lt.value && (
                        <Check className="h-3.5 w-3.5 flex-shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border rounded-md px-2.5 py-1.5">
                  No custom layout -- using defaults
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                JSON Structure
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>
                  <strong>sections</strong> -- array of section objects
                </li>
                <li>
                  <strong>label</strong> -- section heading
                </li>
                <li>
                  <strong>columns</strong> -- 1, 2, or 3
                </li>
                <li>
                  <strong>fields</strong> -- array of field names
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Right: JSON Editor */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Layout JSON
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDefault}
              >
                Load Default
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={upsert.isPending || !!jsonError}
                variant={saved ? "outline" : "default"}
                className={saved ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : ""}
              >
                {upsert.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {upsert.isPending ? "Saving..." : saved ? "Saved!" : "Save Layout"}
              </Button>
            </div>
          </div>

          <div className="relative">
            <Textarea
              value={layoutJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={24}
              spellCheck={false}
              className={cn(
                "font-mono resize-y bg-gray-950 text-green-300",
                jsonError ? "border-destructive" : ""
              )}
              style={{ tabSize: 2, lineHeight: 1.6 }}
            />
          </div>

          {jsonError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}

          {upsert.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {upsert.error instanceof Error
                  ? upsert.error.message
                  : "Failed to save layout"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}

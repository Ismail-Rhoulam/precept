"use client"

import { Plus, X, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FieldOption {
  key: string
  label: string
}

const LEAD_SORT_FIELDS: FieldOption[] = [
  { key: "lead_name", label: "Lead Name" },
  { key: "email", label: "Email" },
  { key: "organization", label: "Organization" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "lead_owner_email", label: "Owner" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
]

const DEAL_SORT_FIELDS: FieldOption[] = [
  { key: "organization_name", label: "Organization" },
  { key: "status", label: "Status" },
  { key: "deal_value", label: "Deal Value" },
  { key: "probability", label: "Probability" },
  { key: "source", label: "Source" },
  { key: "deal_owner_email", label: "Owner" },
  { key: "expected_closure_date", label: "Expected Close" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
]

const CONTACT_SORT_FIELDS: FieldOption[] = [
  { key: "full_name", label: "Name" },
  { key: "email_id", label: "Email" },
  { key: "company_name", label: "Company" },
  { key: "designation", label: "Designation" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
]

const ORGANIZATION_SORT_FIELDS: FieldOption[] = [
  { key: "organization_name", label: "Name" },
  { key: "industry", label: "Industry" },
  { key: "territory", label: "Territory" },
  { key: "no_of_employees", label: "Employees" },
  { key: "annual_revenue", label: "Revenue" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
]

const ENTITY_SORT_FIELDS: Record<string, FieldOption[]> = {
  Lead: LEAD_SORT_FIELDS,
  Deal: DEAL_SORT_FIELDS,
  Contact: CONTACT_SORT_FIELDS,
  Organization: ORGANIZATION_SORT_FIELDS,
}

interface SortControlsProps {
  orderBy: Record<string, string>
  onSortChange: (orderBy: Record<string, string>) => void
  entityType: string
}

export function SortControls({
  orderBy,
  onSortChange,
  entityType,
}: SortControlsProps) {
  const fields = ENTITY_SORT_FIELDS[entityType] || LEAD_SORT_FIELDS
  const sortEntries = Object.entries(orderBy)

  // Fields already in use
  const usedFields = new Set(sortEntries.map(([field]) => field))
  const availableFields = fields.filter((f) => !usedFields.has(f.key))

  function addSort() {
    const nextField = availableFields[0]
    if (!nextField) return

    onSortChange({ ...orderBy, [nextField.key]: "asc" })
  }

  function removeSort(field: string) {
    const newOrderBy = { ...orderBy }
    delete newOrderBy[field]
    onSortChange(newOrderBy)
  }

  function toggleDirection(field: string) {
    const currentDir = orderBy[field]
    onSortChange({
      ...orderBy,
      [field]: currentDir === "asc" ? "desc" : "asc",
    })
  }

  function changeField(oldField: string, newField: string) {
    const direction = orderBy[oldField] || "asc"
    const entries = Object.entries(orderBy)
    const newOrderBy: Record<string, string> = {}
    for (const [key, val] of entries) {
      if (key === oldField) {
        newOrderBy[newField] = direction
      } else {
        newOrderBy[key] = val
      }
    }
    onSortChange(newOrderBy)
  }

  function clearAll() {
    onSortChange({})
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Sort</CardTitle>
          {sortEntries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-destructive h-auto py-1 px-2"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Sort Rows */}
        <div className="space-y-2">
          {sortEntries.map(([field, direction], index) => {
            const fieldDef = fields.find((f) => f.key === field)
            const fieldLabel = fieldDef?.label || field

            // Available options for this row: fields not used by other rows + current field
            const rowAvailableFields = fields.filter(
              (f) => f.key === field || !usedFields.has(f.key)
            )

            return (
              <div key={field} className="flex items-center gap-2">
                <span className="w-10 text-xs font-medium text-muted-foreground text-right flex-shrink-0">
                  {index === 0 ? "Sort" : "Then"}
                </span>

                {/* Field Selector */}
                <Select
                  value={field}
                  onValueChange={(value) => changeField(field, value)}
                >
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rowAvailableFields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Direction Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDirection(field)}
                  className="h-8 gap-1 text-sm font-medium"
                  title={direction === "asc" ? "Ascending" : "Descending"}
                >
                  {direction === "asc" ? (
                    <>
                      <ArrowUp className="w-3.5 h-3.5" />
                      Asc
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3.5 h-3.5" />
                      Desc
                    </>
                  )}
                </Button>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSort(field)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove sort"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {sortEntries.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            No sort applied. Results are sorted by most recent.
          </p>
        )}

        {/* Add Sort Button */}
        {availableFields.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addSort}
            className="mt-3 text-sm font-medium text-primary hover:text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Add sort
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

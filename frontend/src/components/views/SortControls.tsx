"use client"

import { Plus, X, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Sort</h3>
        {sortEntries.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

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
              <span className="w-10 text-xs font-medium text-gray-400 text-right flex-shrink-0">
                {index === 0 ? "Sort" : "Then"}
              </span>

              {/* Field Selector */}
              <select
                value={field}
                onChange={(e) => changeField(field, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {rowAvailableFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Direction Toggle */}
              <button
                onClick={() => toggleDirection(field)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-sm font-medium transition-colors",
                  "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
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
              </button>

              {/* Remove */}
              <button
                onClick={() => removeSort(field)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove sort"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {sortEntries.length === 0 && (
        <p className="text-xs text-gray-400 py-2">
          No sort applied. Results are sorted by most recent.
        </p>
      )}

      {/* Add Sort Button */}
      {availableFields.length > 0 && (
        <button
          onClick={addSort}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add sort
        </button>
      )}
    </div>
  )
}

"use client"

import { GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@/types/view"

interface AvailableColumn {
  key: string
  label: string
  type: string
}

const LEAD_COLUMNS: AvailableColumn[] = [
  { key: "lead_name", label: "Lead Name", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "mobile_no", label: "Mobile", type: "text" },
  { key: "organization", label: "Organization", type: "text" },
  { key: "status", label: "Status", type: "select" },
  { key: "source", label: "Source", type: "select" },
  { key: "industry", label: "Industry", type: "select" },
  { key: "territory", label: "Territory", type: "select" },
  { key: "lead_owner_name", label: "Owner", type: "text" },
  { key: "converted", label: "Converted", type: "boolean" },
  { key: "sla_status", label: "SLA Status", type: "text" },
  { key: "created_at", label: "Created", type: "date" },
  { key: "updated_at", label: "Updated", type: "date" },
]

const DEAL_COLUMNS: AvailableColumn[] = [
  { key: "organization_name", label: "Organization", type: "text" },
  { key: "first_name", label: "First Name", type: "text" },
  { key: "last_name", label: "Last Name", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "mobile_no", label: "Mobile", type: "text" },
  { key: "status", label: "Status", type: "select" },
  { key: "deal_value", label: "Deal Value", type: "number" },
  { key: "probability", label: "Probability", type: "number" },
  { key: "currency", label: "Currency", type: "text" },
  { key: "source", label: "Source", type: "select" },
  { key: "deal_owner_name", label: "Owner", type: "text" },
  { key: "expected_closure_date", label: "Expected Close", type: "date" },
  { key: "created_at", label: "Created", type: "date" },
  { key: "updated_at", label: "Updated", type: "date" },
]

const CONTACT_COLUMNS: AvailableColumn[] = [
  { key: "full_name", label: "Name", type: "text" },
  { key: "first_name", label: "First Name", type: "text" },
  { key: "last_name", label: "Last Name", type: "text" },
  { key: "email_id", label: "Email", type: "text" },
  { key: "mobile_no", label: "Mobile", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "company_name", label: "Company", type: "text" },
  { key: "designation", label: "Designation", type: "text" },
  { key: "gender", label: "Gender", type: "select" },
  { key: "salutation", label: "Salutation", type: "select" },
  { key: "created_at", label: "Created", type: "date" },
  { key: "updated_at", label: "Updated", type: "date" },
]

const ORGANIZATION_COLUMNS: AvailableColumn[] = [
  { key: "organization_name", label: "Name", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "industry", label: "Industry", type: "select" },
  { key: "territory", label: "Territory", type: "select" },
  { key: "no_of_employees", label: "Employees", type: "number" },
  { key: "annual_revenue", label: "Revenue", type: "number" },
  { key: "currency", label: "Currency", type: "text" },
  { key: "created_at", label: "Created", type: "date" },
  { key: "updated_at", label: "Updated", type: "date" },
]

const ENTITY_COLUMNS: Record<string, AvailableColumn[]> = {
  Lead: LEAD_COLUMNS,
  Deal: DEAL_COLUMNS,
  Contact: CONTACT_COLUMNS,
  Organization: ORGANIZATION_COLUMNS,
}

const DEFAULT_COLUMN_KEYS: Record<string, string[]> = {
  Lead: ["lead_name", "email", "organization", "status", "source", "lead_owner_name", "created_at"],
  Deal: ["organization_name", "status", "deal_value", "probability", "source", "deal_owner_name", "created_at"],
  Contact: ["full_name", "email_id", "mobile_no", "company_name", "designation", "created_at"],
  Organization: ["organization_name", "website", "industry", "territory", "no_of_employees", "annual_revenue", "created_at"],
}

interface ColumnSettingsProps {
  columns: ColumnDef[]
  onColumnsChange: (columns: ColumnDef[]) => void
  entityType: string
}

export function ColumnSettings({
  columns,
  onColumnsChange,
  entityType,
}: ColumnSettingsProps) {
  const allColumns = ENTITY_COLUMNS[entityType] || LEAD_COLUMNS
  const defaultKeys = DEFAULT_COLUMN_KEYS[entityType] || []

  // Build a set of active column keys for quick lookup
  const activeColumnKeys = new Set(columns.map((c) => c.key))

  // If no columns are set yet, treat the defaults as active
  const effectiveActiveKeys =
    columns.length > 0
      ? activeColumnKeys
      : new Set(defaultKeys)

  function toggleColumn(col: AvailableColumn) {
    if (effectiveActiveKeys.has(col.key)) {
      // Remove the column
      const newColumns = columns.length > 0
        ? columns.filter((c) => c.key !== col.key)
        : defaultKeys
            .filter((k) => k !== col.key)
            .map((k) => {
              const def = allColumns.find((c) => c.key === k)
              return {
                key: k,
                label: def?.label || k,
                type: def?.type || "text",
              }
            })
      onColumnsChange(newColumns)
    } else {
      // Add the column
      const newCol: ColumnDef = {
        key: col.key,
        label: col.label,
        type: col.type,
      }

      if (columns.length > 0) {
        onColumnsChange([...columns, newCol])
      } else {
        // Initialize from defaults + the new column
        const defaultCols = defaultKeys.map((k) => {
          const def = allColumns.find((c) => c.key === k)
          return {
            key: k,
            label: def?.label || k,
            type: def?.type || "text",
          }
        })
        onColumnsChange([...defaultCols, newCol])
      }
    }
  }

  function resetToDefaults() {
    const defaultCols: ColumnDef[] = defaultKeys.map((key) => {
      const def = allColumns.find((c) => c.key === key)
      return {
        key,
        label: def?.label || key,
        type: def?.type || "text",
      }
    })
    onColumnsChange(defaultCols)
  }

  // Separate active and inactive columns
  // Active columns maintain the order from the columns array
  const activeColumns =
    columns.length > 0
      ? columns
      : defaultKeys.map((k) => {
          const def = allColumns.find((c) => c.key === k)
          return {
            key: k,
            label: def?.label || k,
            type: def?.type || "text",
          }
        })

  const inactiveColumns = allColumns.filter(
    (c) => !effectiveActiveKeys.has(c.key)
  )

  return (
    <div className="w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Columns</h3>
        <button
          onClick={resetToDefaults}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
          title="Reset to default columns"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Active Columns */}
      <div className="px-2 py-2">
        <div className="px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Visible
          </span>
        </div>
        <div className="space-y-0.5">
          {activeColumns.map((col) => (
            <div
              key={col.key}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group"
            >
              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 cursor-grab" />
              <span className="flex-1 text-sm text-gray-700 truncate">
                {col.label}
              </span>
              <button
                onClick={() => {
                  const availCol = allColumns.find((c) => c.key === col.key)
                  if (availCol) toggleColumn(availCol)
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all"
                title="Hide column"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Columns */}
      {inactiveColumns.length > 0 && (
        <div className="px-2 py-2 border-t border-gray-100">
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Hidden
            </span>
          </div>
          <div className="space-y-0.5">
            {inactiveColumns.map((col) => (
              <div
                key={col.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group"
              >
                <div className="w-3.5 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-400 truncate">
                  {col.label}
                </span>
                <button
                  onClick={() => toggleColumn(col)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all"
                  title="Show column"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

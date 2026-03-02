"use client"

import { useState } from "react"
import { Plus, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FilterCondition } from "@/types/view"

interface FieldOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "boolean" | "date"
}

const LEAD_FIELDS: FieldOption[] = [
  { key: "lead_name", label: "Lead Name", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "mobile_no", label: "Mobile", type: "text" },
  { key: "organization", label: "Organization", type: "text" },
  { key: "status", label: "Status", type: "select" },
  { key: "source", label: "Source", type: "select" },
  { key: "industry", label: "Industry", type: "select" },
  { key: "territory", label: "Territory", type: "select" },
  { key: "lead_owner_email", label: "Owner", type: "text" },
  { key: "converted", label: "Converted", type: "boolean" },
  { key: "created_at", label: "Created", type: "date" },
]

const DEAL_FIELDS: FieldOption[] = [
  { key: "organization_name", label: "Organization", type: "text" },
  { key: "status", label: "Status", type: "select" },
  { key: "deal_value", label: "Deal Value", type: "number" },
  { key: "probability", label: "Probability", type: "number" },
  { key: "source", label: "Source", type: "select" },
  { key: "deal_owner_email", label: "Owner", type: "text" },
  { key: "expected_closure_date", label: "Expected Close", type: "date" },
  { key: "created_at", label: "Created", type: "date" },
]

const CONTACT_FIELDS: FieldOption[] = [
  { key: "full_name", label: "Name", type: "text" },
  { key: "email_id", label: "Email", type: "text" },
  { key: "mobile_no", label: "Mobile", type: "text" },
  { key: "company_name", label: "Company", type: "text" },
  { key: "designation", label: "Designation", type: "text" },
  { key: "gender", label: "Gender", type: "select" },
  { key: "created_at", label: "Created", type: "date" },
]

const ORGANIZATION_FIELDS: FieldOption[] = [
  { key: "organization_name", label: "Name", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "industry", label: "Industry", type: "select" },
  { key: "territory", label: "Territory", type: "select" },
  { key: "no_of_employees", label: "Employees", type: "number" },
  { key: "annual_revenue", label: "Revenue", type: "number" },
  { key: "created_at", label: "Created", type: "date" },
]

const ENTITY_FIELDS: Record<string, FieldOption[]> = {
  Lead: LEAD_FIELDS,
  Deal: DEAL_FIELDS,
  Contact: CONTACT_FIELDS,
  Organization: ORGANIZATION_FIELDS,
}

interface OperatorOption {
  value: FilterCondition["operator"]
  label: string
}

const TEXT_OPERATORS: OperatorOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: "like", label: "contains" },
  { value: "not_like", label: "does not contain" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: ">", label: "greater than" },
  { value: "<", label: "less than" },
  { value: ">=", label: "greater or equal" },
  { value: "<=", label: "less or equal" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

const SELECT_OPERATORS: OperatorOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: "in", label: "is any of" },
  { value: "not_in", label: "is none of" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

const BOOLEAN_OPERATORS: OperatorOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
]

const DATE_OPERATORS: OperatorOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: ">", label: "after" },
  { value: "<", label: "before" },
  { value: ">=", label: "on or after" },
  { value: "<=", label: "on or before" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

function getOperatorsForType(fieldType: string): OperatorOption[] {
  switch (fieldType) {
    case "text":
      return TEXT_OPERATORS
    case "number":
      return NUMBER_OPERATORS
    case "select":
      return SELECT_OPERATORS
    case "boolean":
      return BOOLEAN_OPERATORS
    case "date":
      return DATE_OPERATORS
    default:
      return TEXT_OPERATORS
  }
}

function isValuelessOperator(operator: string): boolean {
  return operator === "is_set" || operator === "is_not_set"
}

interface FilterBuilderProps {
  filters: FilterCondition[]
  onFiltersChange: (filters: FilterCondition[]) => void
  entityType: string
}

export function FilterBuilder({
  filters,
  onFiltersChange,
  entityType,
}: FilterBuilderProps) {
  const fields = ENTITY_FIELDS[entityType] || LEAD_FIELDS

  function addFilter() {
    const firstField = fields[0]
    if (!firstField) return

    const operators = getOperatorsForType(firstField.type)
    const defaultOperator = operators[0]?.value || "="

    onFiltersChange([
      ...filters,
      { field: firstField.key, operator: defaultOperator, value: "" },
    ])
  }

  function updateFilter(index: number, updates: Partial<FilterCondition>) {
    const newFilters = filters.map((filter, i) => {
      if (i !== index) return filter

      const updatedFilter = { ...filter, ...updates }

      // If the field changed, reset operator and value to match new field type
      if (updates.field && updates.field !== filter.field) {
        const fieldDef = fields.find((f) => f.key === updates.field)
        if (fieldDef) {
          const operators = getOperatorsForType(fieldDef.type)
          updatedFilter.operator = operators[0]?.value || "="
          updatedFilter.value = ""
        }
      }

      // If the operator changed to a valueless one, clear value
      if (updates.operator && isValuelessOperator(updates.operator)) {
        updatedFilter.value = ""
      }

      return updatedFilter
    })

    onFiltersChange(newFilters)
  }

  function removeFilter(index: number) {
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  function clearAll() {
    onFiltersChange([])
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {filters.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full">
              {filters.length}
            </span>
          )}
        </div>
        {filters.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Rows */}
      <div className="space-y-2">
        {filters.map((filter, index) => {
          const fieldDef = fields.find((f) => f.key === filter.field)
          const fieldType = fieldDef?.type || "text"
          const operators = getOperatorsForType(fieldType)
          const showValue = !isValuelessOperator(filter.operator)

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Where / And label */}
              <span className="w-12 text-xs font-medium text-gray-400 text-right flex-shrink-0">
                {index === 0 ? "Where" : "And"}
              </span>

              {/* Field Selector */}
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, { field: e.target.value })}
                className="w-40 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Operator Selector */}
              <select
                value={filter.operator}
                onChange={(e) =>
                  updateFilter(index, {
                    operator: e.target.value as FilterCondition["operator"],
                  })
                }
                className="w-40 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {/* Value Input */}
              {showValue ? (
                <ValueInput
                  fieldType={fieldType}
                  value={filter.value}
                  onChange={(value) => updateFilter(index, { value })}
                />
              ) : (
                <div className="flex-1" />
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeFilter(index)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add Filter Button */}
      <button
        onClick={addFilter}
        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add filter
      </button>
    </div>
  )
}

// --- Value input sub-component ---

interface ValueInputProps {
  fieldType: string
  value: any
  onChange: (value: any) => void
}

function ValueInput({ fieldType, value, onChange }: ValueInputProps) {
  switch (fieldType) {
    case "number":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder="Enter value"
          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )

    case "boolean":
      return (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value === "true")}
          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )

    case "date":
      return (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )

    case "text":
    case "select":
    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value"
          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )
  }
}

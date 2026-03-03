"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Filters</CardTitle>
            {filters.length > 0 && (
              <Badge className="rounded-full text-[10px] font-bold">
                {filters.length}
              </Badge>
            )}
          </div>
          {filters.length > 0 && (
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
                <span className="w-12 text-xs font-medium text-muted-foreground text-right flex-shrink-0">
                  {index === 0 ? "Where" : "And"}
                </span>

                {/* Field Selector */}
                <Select
                  value={filter.field}
                  onValueChange={(value) => updateFilter(index, { field: value })}
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Operator Selector */}
                <Select
                  value={filter.operator}
                  onValueChange={(value) =>
                    updateFilter(index, {
                      operator: value as FilterCondition["operator"],
                    })
                  }
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(index)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Add Filter Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addFilter}
          className="mt-3 text-sm font-medium text-primary hover:text-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          Add filter
        </Button>
      </CardContent>
    </Card>
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
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder="Enter value"
          className="flex-1 h-8 text-sm"
        />
      )

    case "boolean":
      return (
        <Select
          value={String(value)}
          onValueChange={(val) => onChange(val === "true")}
        >
          <SelectTrigger className="flex-1 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )

    case "date":
      return (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 text-sm"
        />
      )

    case "text":
    case "select":
    default:
      return (
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value"
          className="flex-1 h-8 text-sm"
        />
      )
  }
}

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLeads, useCreateLead } from "@/hooks/useLeads"
import { useLeadKanban } from "@/hooks/useKanban"
import { useLeadGroupBy } from "@/hooks/useGroupBy"
import type { LeadListParams, LeadCreate } from "@/types/lead"
import type { Lead } from "@/types/lead"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Users,
  Filter,
  LayoutList,
  Columns3,
  Layers,
} from "lucide-react"
import { format } from "date-fns"
import KanbanBoard from "@/components/views/KanbanBoard"
import { LeadKanbanCard } from "@/components/views/KanbanCard"
import GroupByView from "@/components/views/GroupByView"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcutsModal"

type SortField = "lead_name" | "email" | "organization" | "status" | "source" | "lead_owner_name" | "created_at"
type SortDirection = "asc" | "desc"
type ViewType = "list" | "kanban" | "group_by"

const LEAD_KANBAN_FIELDS = [
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "industry", label: "Industry" },
  { value: "territory", label: "Territory" },
]

const LEAD_GROUP_BY_FIELDS = [
  { value: "source", label: "Source" },
  { value: "status", label: "Status" },
  { value: "industry", label: "Industry" },
  { value: "territory", label: "Territory" },
  { value: "lead_owner_name", label: "Owner" },
]

function StatusBadge({ status, color }: { status: string; color?: string }) {
  const fallbackColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-800",
    Open: "bg-green-100 text-green-800",
    Replied: "bg-yellow-100 text-yellow-800",
    Opportunity: "bg-purple-100 text-purple-800",
    Interested: "bg-emerald-100 text-emerald-800",
    Converted: "bg-indigo-100 text-indigo-800",
    "Do Not Contact": "bg-red-100 text-red-800",
    Lost: "bg-gray-100 text-gray-600",
  }

  const colorClass = fallbackColors[status] || "bg-gray-100 text-gray-700"

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colorClass
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {status}
    </span>
  )
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField | null; direction: SortDirection }) {
  if (field !== currentField) {
    return <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
  }
  return direction === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-gray-700" />
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-gray-100 px-6 py-4 gap-4">
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">No leads found</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        There are no leads matching your current filters. Try adjusting your search or create a new lead.
      </p>
    </div>
  )
}

interface CreateLeadFormProps {
  onClose: () => void
}

function CreateLeadForm({ onClose }: CreateLeadFormProps) {
  const createLead = useCreateLead()
  const [formData, setFormData] = useState<LeadCreate>({
    first_name: "",
    last_name: "",
    email: "",
    mobile_no: "",
    organization: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LeadCreate, string>>>({})

  function validate(): boolean {
    const newErrors: Partial<Record<keyof LeadCreate, string>> = {}
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required"
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleChange(field: keyof LeadCreate, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: LeadCreate = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
    }
    if (formData.mobile_no?.trim()) payload.mobile_no = formData.mobile_no.trim()
    if (formData.organization?.trim()) payload.organization = formData.organization.trim()

    try {
      await createLead.mutateAsync(payload)
      onClose()
    } catch {
      // Error is handled by the mutation's error state
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Create New Lead</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="create-first-name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="create-first-name"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.first_name ? "border-red-300" : "border-gray-300"
              )}
              placeholder="John"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="create-last-name" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="create-last-name"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.last_name ? "border-red-300" : "border-gray-300"
              )}
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="create-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.email ? "border-red-300" : "border-gray-300"
              )}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="create-mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile No
            </label>
            <input
              id="create-mobile"
              type="text"
              value={formData.mobile_no}
              onChange={(e) => handleChange("mobile_no", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label htmlFor="create-organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <input
              id="create-organization"
              type="text"
              value={formData.organization}
              onChange={(e) => handleChange("organization", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Acme Inc."
            />
          </div>
        </div>

        {createLead.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              {createLead.error instanceof Error ? createLead.error.message : "Failed to create lead. Please try again."}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createLead.isPending}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-md transition-colors inline-flex items-center gap-2",
              createLead.isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {createLead.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {createLead.isPending ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LeadsListPage() {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [showFilters, setShowFilters] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageSize = 20

  // View type state
  const [viewType, setViewType] = useState<ViewType>("list")
  const [kanbanColumnField, setKanbanColumnField] = useState("status")
  const [groupByField, setGroupByField] = useState("source")
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      action: () => setShowCreateForm(true),
      description: "New lead",
    },
    {
      key: "?",
      action: () => setShowShortcutsModal(true),
      description: "Show keyboard shortcuts",
    },
  ])

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput])

  const buildParams = useCallback((): LeadListParams => {
    const params: LeadListParams = {
      page,
      page_size: pageSize,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter) params.status = statusFilter
    if (sourceFilter) params.source = sourceFilter
    if (sortField) {
      params.ordering = sortDirection === "desc" ? `-${sortField}` : sortField
    }
    return params
  }, [page, pageSize, debouncedSearch, statusFilter, sourceFilter, sortField, sortDirection])

  const { data, isLoading, isError, error } = useLeads(buildParams())

  // Kanban & Group By hooks
  const kanbanQuery = useLeadKanban({
    column_field: kanbanColumnField,
    page_size: 20,
  })
  const groupByQuery = useLeadGroupBy({
    group_by_field: groupByField,
  })

  const leads = data?.results ?? []
  const totalLeads = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize))

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setPage(1)
  }

  function handleRowClick(lead: Lead) {
    router.push(`/leads/${lead.id}`)
  }

  function handleClearFilters() {
    setStatusFilter("")
    setSourceFilter("")
    setPage(1)
  }

  const hasActiveFilters = statusFilter || sourceFilter

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalLeads > 0
              ? `${totalLeads} lead${totalLeads === 1 ? "" : "s"} total`
              : "Manage your leads pipeline"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </button>
      </div>

      {/* Create Lead Form */}
      {showCreateForm && (
        <CreateLeadForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* View Type Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {[
            { key: "list" as ViewType, label: "List", icon: LayoutList },
            { key: "kanban" as ViewType, label: "Kanban", icon: Columns3 },
            { key: "group_by" as ViewType, label: "Group By", icon: Layers },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewType(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewType === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Kanban column field selector */}
        {viewType === "kanban" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Column:</label>
            <select
              value={kanbanColumnField}
              onChange={(e) => setKanbanColumnField(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {LEAD_KANBAN_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Group By field selector */}
        {viewType === "group_by" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Group by:</label>
            <select
              value={groupByField}
              onChange={(e) => setGroupByField(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {LEAD_GROUP_BY_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban View */}
      {viewType === "kanban" && (
        <KanbanBoard
          columns={kanbanQuery.data?.columns ?? []}
          onCardClick={(item) => router.push(`/leads/${item.id}`)}
          onCardMove={(itemId, fromColumn, toColumn) => {
            // Card move will be handled when the backend PATCH API is ready
            console.log(`Move lead ${itemId} from "${fromColumn}" to "${toColumn}"`)
          }}
          renderCard={(item) => <LeadKanbanCard lead={item as Lead} />}
          isLoading={kanbanQuery.isLoading}
          entityType="leads"
        />
      )}

      {/* Group By View */}
      {viewType === "group_by" && (
        <GroupByView
          groups={groupByQuery.data?.groups ?? []}
          results={groupByQuery.data?.results ?? []}
          entityType="leads"
          groupByField={groupByField}
          onItemClick={(item) => router.push(`/leads/${item.id}`)}
          isLoading={groupByQuery.isLoading}
          total={groupByQuery.data?.total ?? 0}
        />
      )}

      {/* List View: Search & Filters */}
      {viewType === "list" && <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, email, or organization..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors",
                showFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>

          {/* Filter Fields */}
          {showFilters && (
            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <input
                  id="filter-status"
                  type="text"
                  placeholder="e.g. New, Open, Replied"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 max-w-xs">
                <label htmlFor="filter-source" className="block text-xs font-medium text-gray-600 mb-1">
                  Source
                </label>
                <input
                  id="filter-source"
                  type="text"
                  placeholder="e.g. Website, Referral"
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Failed to load leads. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("lead_name")}
                  >
                    <div className="flex items-center gap-1.5">
                      Lead Name
                      <SortIcon field="lead_name" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1.5">
                      Email
                      <SortIcon field="email" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("organization")}
                  >
                    <div className="flex items-center gap-1.5">
                      Organization
                      <SortIcon field="organization" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <SortIcon field="status" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("source")}
                  >
                    <div className="flex items-center gap-1.5">
                      Source
                      <SortIcon field="source" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("lead_owner_name")}
                  >
                    <div className="flex items-center gap-1.5">
                      Owner
                      <SortIcon field="lead_owner_name" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1.5">
                      Created
                      <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-xs text-gray-400">{lead.reference_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.organization || <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} color={lead.status_color} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.source || <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.lead_owner_name || <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && leads.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalLeads)} of {totalLeads} leads
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors",
                  page <= 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors",
                  page >= totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  )
}

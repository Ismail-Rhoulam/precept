"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Handshake,
  LayoutList,
  Columns3,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDeals, useCreateDeal } from "@/hooks/useDeals"
import { useDealKanban } from "@/hooks/useKanban"
import { useDealGroupBy } from "@/hooks/useGroupBy"
import type { DealListParams, DealCreate } from "@/types/deal"
import type { Deal } from "@/types/deal"
import KanbanBoard from "@/components/views/KanbanBoard"
import { DealKanbanCard } from "@/components/views/KanbanCard"
import GroupByView from "@/components/views/GroupByView"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcutsModal"

const PAGE_SIZE = 20

type ViewType = "list" | "kanban" | "group_by"

const DEAL_KANBAN_FIELDS = [
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
]

const DEAL_GROUP_BY_FIELDS = [
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "deal_owner_name", label: "Owner" },
  { value: "organization_name", label: "Organization" },
]

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || "$"} ${value.toLocaleString()}`
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

type SortField =
  | "reference_id"
  | "first_name"
  | "organization_name"
  | "status"
  | "deal_value"
  | "probability"
  | "deal_owner_name"
  | "created_at"

interface SortState {
  field: SortField
  direction: "asc" | "desc"
}

const INITIAL_FORM: DealCreate = {
  first_name: "",
  last_name: "",
  email: "",
  organization_name: "",
  deal_value: 0,
  currency: "USD",
  status: "Qualification",
}

export default function DealsPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    direction: "desc",
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<DealCreate>({ ...INITIAL_FORM })
  const [createError, setCreateError] = useState<string | null>(null)

  // View type state
  const [viewType, setViewType] = useState<ViewType>("list")
  const [kanbanColumnField, setKanbanColumnField] = useState("status")
  const [groupByField, setGroupByField] = useState("status")
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      action: () => setShowCreateForm(true),
      description: "New deal",
    },
    {
      key: "?",
      action: () => setShowShortcutsModal(true),
      description: "Show keyboard shortcuts",
    },
  ])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const params: DealListParams = {
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch || undefined,
    ordering:
      sort.direction === "desc" ? `-${sort.field}` : sort.field,
  }

  const { data, isLoading, isError, error } = useDeals(params)
  const createDeal = useCreateDeal()

  // Kanban & Group By hooks
  const kanbanQuery = useDealKanban({
    column_field: kanbanColumnField,
    page_size: 20,
  })
  const groupByQuery = useDealGroupBy({
    group_by_field: groupByField,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
  }, [])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!createForm.first_name.trim()) {
      setCreateError("First name is required")
      return
    }

    try {
      await createDeal.mutateAsync(createForm)
      setShowCreateForm(false)
      setCreateForm({ ...INITIAL_FORM })
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create deal"
      )
    }
  }

  const SortIcon = ({
    field,
  }: {
    field: SortField
  }) => {
    if (sort.field !== field) {
      return (
        <ChevronUp className="h-3 w-3 text-gray-300 ml-1 inline-block" />
      )
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3 text-gray-700 ml-1 inline-block" />
    ) : (
      <ChevronDown className="h-3 w-3 text-gray-700 ml-1 inline-block" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your sales pipeline and track deal progress.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Deal
            </>
          )}
        </button>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Create New Deal
          </h3>
          <form onSubmit={handleCreateSubmit}>
            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={createForm.first_name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, first_name: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={createForm.last_name || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, last_name: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={createForm.email || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={createForm.organization_name || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      organization_name: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deal Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={createForm.deal_value || 0}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      deal_value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={createForm.currency || "USD"}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, currency: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={createForm.status || "Qualification"}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, status: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="Qualification">Qualification</option>
                  <option value="Needs Analysis">Needs Analysis</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={createDeal.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDeal.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Deal"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
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
              {DEAL_KANBAN_FIELDS.map((f) => (
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
              {DEAL_GROUP_BY_FIELDS.map((f) => (
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
          onCardClick={(item) => router.push(`/deals/${item.id}`)}
          onCardMove={(itemId, fromColumn, toColumn) => {
            // Card move will be handled when the backend PATCH API is ready
            console.log(`Move deal ${itemId} from "${fromColumn}" to "${toColumn}"`)
          }}
          renderCard={(item) => <DealKanbanCard deal={item as Deal} />}
          isLoading={kanbanQuery.isLoading}
          entityType="deals"
        />
      )}

      {/* Group By View */}
      {viewType === "group_by" && (
        <GroupByView
          groups={groupByQuery.data?.groups ?? []}
          results={groupByQuery.data?.results ?? []}
          entityType="deals"
          groupByField={groupByField}
          onItemClick={(item) => router.push(`/deals/${item.id}`)}
          isLoading={groupByQuery.isLoading}
          total={groupByQuery.data?.total ?? 0}
        />
      )}

      {/* List View: Search */}
      {viewType === "list" && <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search deals by name, organization, email..."
          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading deals...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-600 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load deals"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : data && data.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Handshake className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No deals found</p>
            <p className="mt-1 text-sm">
              {debouncedSearch
                ? "Try adjusting your search criteria."
                : "Get started by creating your first deal."}
            </p>
            {!debouncedSearch && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Deal
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      {
                        label: "Reference ID",
                        field: "reference_id" as SortField,
                      },
                      {
                        label: "Deal Name",
                        field: "first_name" as SortField,
                      },
                      {
                        label: "Organization",
                        field: "organization_name" as SortField,
                      },
                      { label: "Status", field: "status" as SortField },
                      {
                        label: "Deal Value",
                        field: "deal_value" as SortField,
                      },
                      {
                        label: "Probability",
                        field: "probability" as SortField,
                      },
                      {
                        label: "Owner",
                        field: "deal_owner_name" as SortField,
                      },
                      {
                        label: "Created",
                        field: "created_at" as SortField,
                      },
                    ].map((col) => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                      >
                        {col.label}
                        <SortIcon field={col.field} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.results.map((deal) => {
                    const dealName = [deal.first_name, deal.last_name]
                      .filter(Boolean)
                      .join(" ") || "Unnamed Deal"

                    return (
                      <tr
                        key={deal.id}
                        onClick={() => router.push(`/deals/${deal.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {deal.reference_id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {dealName}
                          </div>
                          {deal.email && (
                            <div className="text-xs text-gray-500">
                              {deal.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {deal.organization_name || "--"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            )}
                            style={{
                              backgroundColor: deal.status_color
                                ? `${deal.status_color}20`
                                : "#e5e7eb",
                              color: deal.status_color || "#374151",
                            }}
                          >
                            {deal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(deal.deal_value, deal.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {deal.probability}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {deal.deal_owner_name || deal.deal_owner_email || "--"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(deal.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(page * PAGE_SIZE, data?.total || 0)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{data?.total || 0}</span>{" "}
                  deals
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </>}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  )
}

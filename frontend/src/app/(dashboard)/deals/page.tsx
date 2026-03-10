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
import { useDeals, useCreateDeal, useUpdateDeal } from "@/hooks/useDeals"
import { useDealKanban } from "@/hooks/useKanban"
import { useDealGroupBy } from "@/hooks/useGroupBy"
import type { DealListParams, DealCreate } from "@/types/deal"
import type { Deal } from "@/types/deal"
import KanbanBoard from "@/components/views/KanbanBoard"
import { DealKanbanCard } from "@/components/views/KanbanCard"
import GroupByView from "@/components/views/GroupByView"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcutsModal"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [viewType, setViewType] = useState<ViewType>("kanban")
  const [kanbanColumnField, setKanbanColumnField] = useState("status")
  const [groupByField, setGroupByField] = useState("status")
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Handle URL hash for sidebar navigation (#new, #kanban, #group_by)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash === "new") {
        setShowCreateForm(true)
        window.history.replaceState(null, "", window.location.pathname)
      } else if (hash === "kanban") {
        setViewType("kanban")
        window.history.replaceState(null, "", window.location.pathname)
      } else if (hash === "group_by") {
        setViewType("group_by")
        window.history.replaceState(null, "", window.location.pathname)
      }
    }
    handleHash()
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])

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

  const updateDeal = useUpdateDeal()

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
        <ChevronUp className="h-3 w-3 text-muted-foreground/50 ml-1 inline-block" />
      )
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3 text-muted-foreground ml-1 inline-block" />
    ) : (
      <ChevronDown className="h-3 w-3 text-muted-foreground ml-1 inline-block" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your sales pipeline and track deal progress.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
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
        </Button>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Create New Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit}>
              {createError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, first_name: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    type="text"
                    value={createForm.last_name || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, last_name: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={createForm.email || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Organization</Label>
                  <Input
                    type="text"
                    value={createForm.organization_name || ""}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        organization_name: e.target.value,
                      })
                    }
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Deal Value</Label>
                  <Input
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
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={createForm.currency || "USD"}
                    onValueChange={(value) =>
                      setCreateForm({ ...createForm, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={createForm.status || "Qualification"}
                    onValueChange={(value) =>
                      setCreateForm({ ...createForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Qualification">Qualification</SelectItem>
                      <SelectItem value="Needs Analysis">Needs Analysis</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed Won">Closed Won</SelectItem>
                      <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={createDeal.isPending}
                    className="w-full"
                  >
                    {createDeal.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Deal"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* View Type Tabs */}
      <div className="flex items-center gap-4">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <LayoutList className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5">
              <Columns3 className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="group_by" className="gap-1.5">
              <Layers className="w-4 h-4" />
              Group By
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Kanban column field selector */}
        {viewType === "kanban" && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Column:</Label>
            <Select value={kanbanColumnField} onValueChange={setKanbanColumnField}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_KANBAN_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Group By field selector */}
        {viewType === "group_by" && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Group by:</Label>
            <Select value={groupByField} onValueChange={setGroupByField}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_GROUP_BY_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Kanban View */}
      {viewType === "kanban" && (
        <KanbanBoard
          columns={kanbanQuery.data?.columns ?? []}
          onCardClick={(item) => router.push(`/deals/${item.id}`)}
          onCardMove={(itemId, _fromColumnId, toColumnId) => {
            if (toColumnId == null) return
            updateDeal.mutate({
              id: itemId,
              data: { [`${kanbanColumnField}_id`]: toColumnId } as Partial<DealCreate>,
            })
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search deals by name, organization, email..."
          className="pl-10 pr-10"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading deals...</span>
          </CardContent>
        ) : isError ? (
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-red-600 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load deals"}
            </p>
            <Button
              variant="link"
              onClick={() => window.location.reload()}
              className="mt-3"
            >
              Try again
            </Button>
          </CardContent>
        ) : data && data.results.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Handshake className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">No deals found</p>
            <p className="mt-1 text-sm">
              {debouncedSearch
                ? "Try adjusting your search criteria."
                : "Get started by creating your first deal."}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4" />
                New Deal
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
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
                    <TableHead
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className="cursor-pointer hover:bg-muted transition-colors select-none whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider"
                    >
                      {col.label}
                      <SortIcon field={col.field} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results.map((deal) => {
                  const dealName = [deal.first_name, deal.last_name]
                    .filter(Boolean)
                    .join(" ") || "Unnamed Deal"

                  return (
                    <TableRow
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground font-mono">
                        {deal.reference_id}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {dealName}
                        </div>
                        {deal.email && (
                          <div className="text-xs text-muted-foreground">
                            {deal.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {deal.organization_name || "--"}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="rounded-full"
                          style={{
                            backgroundColor: deal.status_color
                              ? `${deal.status_color}20`
                              : "#e5e7eb",
                            color: deal.status_color || "#374151",
                            borderColor: deal.status_color
                              ? `${deal.status_color}40`
                              : "#d1d5db",
                          }}
                        >
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(deal.deal_value, deal.currency)}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {deal.probability}%
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {deal.deal_owner_name || deal.deal_owner_email || "--"}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(deal.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-4 py-3">
                <div className="text-sm text-muted-foreground">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>
      </>}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  )
}

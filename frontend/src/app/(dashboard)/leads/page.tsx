"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLeads, useCreateLead, useUpdateLead } from "@/hooks/useLeads"
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    New: "bg-blue-100 text-blue-800 border-blue-200",
    Open: "bg-green-100 text-green-800 border-green-200",
    Replied: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Opportunity: "bg-purple-100 text-purple-800 border-purple-200",
    Interested: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Converted: "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Do Not Contact": "bg-red-100 text-red-800 border-red-200",
    Lost: "bg-muted text-muted-foreground border-border",
  }

  const colorClass = fallbackColors[status] || "bg-muted text-muted-foreground border-border"

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full", colorClass)}
      style={color ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` } : undefined}
    >
      {status}
    </Badge>
  )
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField | null; direction: SortDirection }) {
  if (field !== currentField) {
    return <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" />
  }
  return direction === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
  )
}

function LoadingSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-border px-6 py-4 gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No leads found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          There are no leads matching your current filters. Try adjusting your search or create a new lead.
        </p>
      </CardContent>
    </Card>
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
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Create New Lead</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-first-name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-first-name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className={cn(errors.first_name && "border-red-300 focus-visible:ring-red-500")}
                placeholder="John"
              />
              {errors.first_name && (
                <p className="text-xs text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-last-name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-last-name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className={cn(errors.last_name && "border-red-300 focus-visible:ring-red-500")}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="text-xs text-red-600">{errors.last_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={cn(errors.email && "border-red-300 focus-visible:ring-red-500")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-mobile">Mobile No</Label>
              <Input
                id="create-mobile"
                type="text"
                value={formData.mobile_no}
                onChange={(e) => handleChange("mobile_no", e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-organization">Organization</Label>
              <Input
                id="create-organization"
                type="text"
                value={formData.organization}
                onChange={(e) => handleChange("organization", e.target.value)}
                placeholder="Precept Inc."
              />
            </div>
          </div>

          {createLead.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {createLead.error instanceof Error ? createLead.error.message : "Failed to create lead. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex items-center gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createLead.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
  const [viewType, setViewType] = useState<ViewType>("kanban")
  const [kanbanColumnField, setKanbanColumnField] = useState("status")
  const [groupByField, setGroupByField] = useState("source")
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

  const updateLead = useUpdateLead()

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
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalLeads > 0
              ? `${totalLeads} lead${totalLeads === 1 ? "" : "s"} total`
              : "Manage your leads pipeline"}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </div>

      {/* Create Lead Form */}
      {showCreateForm && (
        <CreateLeadForm onClose={() => setShowCreateForm(false)} />
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
                {LEAD_KANBAN_FIELDS.map((f) => (
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
                {LEAD_GROUP_BY_FIELDS.map((f) => (
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
          onCardClick={(item) => router.push(`/leads/${item.id}`)}
          onCardMove={(itemId, _fromColumnId, toColumnId) => {
            if (toColumnId == null) return
            updateLead.mutate({
              id: itemId,
              data: { [`${kanbanColumnField}_id`]: toColumnId } as Partial<LeadCreate>,
            })
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
      {viewType === "list" && <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search leads by name, email, or organization..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                showFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  : ""
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Button>
          </div>

          {/* Filter Fields */}
          {showFilters && (
            <div className="mt-4 flex items-end gap-4">
              <div className="flex-1 max-w-xs space-y-1.5">
                <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
                  Status
                </Label>
                <Input
                  id="filter-status"
                  type="text"
                  placeholder="e.g. New, Open, Replied"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex-1 max-w-xs space-y-1.5">
                <Label htmlFor="filter-source" className="text-xs text-muted-foreground">
                  Source
                </Label>
                <Input
                  id="filter-source"
                  type="text"
                  placeholder="e.g. Website, Referral"
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Table */}
          {isError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : "Failed to load leads. Please try again."}
              </p>
              <Button
                variant="link"
                onClick={() => window.location.reload()}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : leads.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("lead_name")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Lead Name
                      <SortIcon field="lead_name" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Email
                      <SortIcon field="email" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("organization")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Organization
                      <SortIcon field="organization" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Status
                      <SortIcon field="status" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("source")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Source
                      <SortIcon field="source" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("lead_owner_name")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Owner
                      <SortIcon field="lead_owner_name" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors select-none px-6"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      Created
                      <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="cursor-pointer"
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{lead.reference_id}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {lead.email}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {lead.organization || <span className="text-muted-foreground/50">&mdash;</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} color={lead.status_color} />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {lead.source || <span className="text-muted-foreground/50">&mdash;</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {lead.lead_owner_name || <span className="text-muted-foreground/50">&mdash;</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {!isLoading && !isError && leads.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalLeads)} of {totalLeads} leads
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  )
}

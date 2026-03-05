"use client"

import { useState, useCallback } from "react"
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
  Building2,
} from "lucide-react"
import { useOrganizations, useCreateOrganization } from "@/hooks/useOrganizations"
import type { OrganizationListParams, OrganizationCreate } from "@/types/organization"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

const PAGE_SIZE = 20

function formatRevenue(value: number | null | undefined, currency?: string): string {
  if (value === null || value === undefined || value === 0) return "-"
  const currencyCode = currency || "USD"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currencyCode} ${value.toLocaleString()}`
  }
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [ordering, setOrdering] = useState("-created_at")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const params: OrganizationListParams = {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    ordering,
  }

  const { data, isLoading, isError } = useOrganizations(params)
  const createOrganization = useCreateOrganization()

  const [formData, setFormData] = useState<OrganizationCreate>({
    organization_name: "",
    website: "",
    no_of_employees: undefined,
    annual_revenue: undefined,
    currency: "USD",
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  const handleSort = useCallback(
    (field: string) => {
      if (ordering === field) {
        setOrdering(`-${field}`)
      } else if (ordering === `-${field}`) {
        setOrdering(field)
      } else {
        setOrdering(field)
      }
      setPage(1)
    },
    [ordering]
  )

  const getSortIcon = (field: string) => {
    if (ordering === field) return <ChevronUp className="h-4 w-4" />
    if (ordering === `-${field}`) return <ChevronDown className="h-4 w-4" />
    return null
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOrganization.mutateAsync(formData)
      setShowCreateForm(false)
      setFormData({
        organization_name: "",
        website: "",
        no_of_employees: undefined,
        annual_revenue: undefined,
        currency: "USD",
      })
    } catch {
      // Error is handled by mutation state
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organizations and company records.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Create New Organization</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateForm(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-org-name">
                    Organization Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-org-name"
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={(e) =>
                      setFormData({ ...formData, organization_name: e.target.value })
                    }
                    placeholder="Precept Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-website">Website</Label>
                  <Input
                    id="create-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-employees">No. of Employees</Label>
                  <Input
                    id="create-employees"
                    type="number"
                    min={0}
                    value={formData.no_of_employees ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        no_of_employees: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-revenue">Annual Revenue</Label>
                  <Input
                    id="create-revenue"
                    type="number"
                    min={0}
                    value={formData.annual_revenue ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annual_revenue: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-currency">Currency</Label>
                  <Input
                    id="create-currency"
                    type="text"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrganization.isPending}>
                  {createOrganization.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Organization
                </Button>
              </div>
              {createOrganization.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createOrganization.error?.message || "Failed to create organization."}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} organization{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[90px]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">Failed to load organizations. Please try again.</p>
          </div>
        ) : data && data.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No organizations found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try adjusting your search terms."
                : "Get started by creating a new organization."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("organization_name")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {getSortIcon("organization_name")}
                    </div>
                  </TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead
                    onClick={() => handleSort("no_of_employees")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Employees
                      {getSortIcon("no_of_employees")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("annual_revenue")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Revenue
                      {getSortIcon("annual_revenue")}
                    </div>
                  </TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead
                    onClick={() => handleSort("created_at")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {getSortIcon("created_at")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results.map((org) => (
                  <TableRow
                    key={org.id}
                    onClick={() => router.push(`/organizations/${org.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {org.organization_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {org.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.no_of_employees
                        ? org.no_of_employees.toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRevenue(org.annual_revenue, org.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.industry || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.territory || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({data?.total} total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

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
import { cn } from "@/lib/utils"
import { useOrganizations, useCreateOrganization } from "@/hooks/useOrganizations"
import type { OrganizationListParams, OrganizationCreate } from "@/types/organization"

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
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organizations and company records.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Organization
            </h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. of Employees
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.no_of_employees ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      no_of_employees: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.annual_revenue ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      annual_revenue: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="1000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="USD"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOrganization.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {createOrganization.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Organization
              </button>
            </div>
            {createOrganization.isError && (
              <p className="text-sm text-red-600">
                {createOrganization.error?.message || "Failed to create organization."}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {data && (
          <span className="text-sm text-gray-500">
            {data.total} organization{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-sm">Failed to load organizations. Please try again.</p>
          </div>
        ) : data && data.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Building2 className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium text-gray-900">No organizations found</p>
            <p className="text-sm text-gray-500 mt-1">
              {search
                ? "Try adjusting your search terms."
                : "Get started by creating a new organization."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort("organization_name")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {getSortIcon("organization_name")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th
                      onClick={() => handleSort("no_of_employees")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Employees
                        {getSortIcon("no_of_employees")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("annual_revenue")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Revenue
                        {getSortIcon("annual_revenue")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Territory
                    </th>
                    <th
                      onClick={() => handleSort("created_at")}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {getSortIcon("created_at")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.results.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => router.push(`/organizations/${org.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {org.organization_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.no_of_employees
                          ? org.no_of_employees.toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRevenue(org.annual_revenue, org.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.industry || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.territory || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                <div className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({data?.total} total)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      page === 1
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      page === totalPages
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
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
    </div>
  )
}

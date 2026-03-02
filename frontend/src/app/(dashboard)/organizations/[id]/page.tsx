"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrganization, useUpdateOrganization, useDeleteOrganization } from "@/hooks/useOrganizations"
import type { OrganizationCreate } from "@/types/organization"

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

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = Number(params.id)

  const { data: organization, isLoading, isError } = useOrganization(organizationId)
  const updateOrganization = useUpdateOrganization()
  const deleteOrganization = useDeleteOrganization()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<Partial<OrganizationCreate>>({})

  const startEditing = () => {
    if (!organization) return
    setFormData({
      organization_name: organization.organization_name,
      website: organization.website,
      no_of_employees: organization.no_of_employees,
      annual_revenue: organization.annual_revenue,
      currency: organization.currency,
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      await updateOrganization.mutateAsync({ id: organizationId, data: formData })
      setIsEditing(false)
    } catch {
      // Error is handled by mutation state
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrganization.mutateAsync(organizationId)
      router.push("/organizations")
    } catch {
      // Error is handled by mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !organization) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/organizations")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </button>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Organization not found or failed to load.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/organizations")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {organization.organization_name}
          </h1>
          {organization.industry && (
            <p className="mt-1 text-sm text-gray-500">
              {organization.industry}
              {organization.territory ? ` - ${organization.territory}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateOrganization.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {updateOrganization.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error messages */}
      {updateOrganization.isError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">
            {updateOrganization.error?.message || "Failed to update organization."}
          </p>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">
                Are you sure you want to delete this organization?
              </p>
              <p className="text-sm text-red-600 mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteOrganization.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteOrganization.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
          {deleteOrganization.isError && (
            <p className="text-sm text-red-700 mt-2">
              {deleteOrganization.error?.message || "Failed to delete organization."}
            </p>
          )}
        </div>
      )}

      {/* Detail Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Organization Details
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Organization Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.organization_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.organization_name}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.website ? (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {organization.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              )}
            </div>

            {/* No. of Employees */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                No. of Employees
              </label>
              {isEditing ? (
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
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.no_of_employees
                    ? organization.no_of_employees.toLocaleString()
                    : "-"}
                </p>
              )}
            </div>

            {/* Annual Revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Annual Revenue
              </label>
              {isEditing ? (
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
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formatRevenue(organization.annual_revenue, organization.currency)}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Industry
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.industry_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industry_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Industry ID"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.industry || "-"}
                </p>
              )}
            </div>

            {/* Territory */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Territory
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.territory_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      territory_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Territory ID"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.territory || "-"}
                </p>
              )}
            </div>

            {/* Currency */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Currency
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.currency || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="USD"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {organization.currency || "-"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>
              Created: {new Date(organization.created_at).toLocaleString()}
            </span>
            <span>
              Updated: {new Date(organization.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

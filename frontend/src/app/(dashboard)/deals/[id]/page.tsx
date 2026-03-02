"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  X,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDeal, useUpdateDeal, useDeleteDeal } from "@/hooks/useDeals"
import { ActivityTimeline } from "@/components/activities/ActivityTimeline"
import { ProductLineItems } from "@/components/products/ProductLineItems"
import { SLABadge } from "@/components/sla/SLABadge"
import type { DealCreate } from "@/types/deal"

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

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toISOString().split("T")[0]
  } catch {
    return dateStr
  }
}

export default function DealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dealId = Number(params.id)

  const { data: deal, isLoading, isError, error } = useDeal(dealId)
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState<Partial<DealCreate>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const startEditing = () => {
    if (!deal) return
    setEditForm({
      first_name: deal.first_name || "",
      last_name: deal.last_name || "",
      email: deal.email || "",
      mobile_no: deal.mobile_no || "",
      organization_name: deal.organization_name || "",
      status: deal.status || "",
      deal_value: deal.deal_value,
      probability: deal.probability,
      expected_closure_date: formatDate(deal.expected_closure_date),
      currency: deal.currency || "USD",
      source: deal.source || "",
      deal_owner_email: deal.deal_owner_email || "",
      lead_name: deal.lead_name || "",
    })
    setSaveError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({})
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaveError(null)
    try {
      await updateDeal.mutateAsync({ id: dealId, data: editForm })
      setIsEditing(false)
      setEditForm({})
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update deal"
      )
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(dealId)
      router.push("/deals")
    } catch {
      // Error handled by the mutation
    }
  }

  const updateField = (field: keyof DealCreate, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading deal...</span>
      </div>
    )
  }

  // Error state
  if (isError || !deal) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/deals")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">
            Failed to load deal
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error
              ? error.message
              : "The deal could not be found or an error occurred."}
          </p>
          <button
            onClick={() => router.push("/deals")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Deals
          </button>
        </div>
      </div>
    )
  }

  const dealName =
    [deal.first_name, deal.last_name].filter(Boolean).join(" ") ||
    "Unnamed Deal"

  // Check if deal has sla_status (may be present on the deal object)
  const dealSlaStatus = (deal as any).sla_status as string | undefined

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/deals")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deals
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{dealName}</h1>
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
              {dealSlaStatus && (
                <SLABadge slaStatus={dealSlaStatus} responseBy={null} />
              )}
            </div>
            <p className="text-sm text-gray-500 font-mono">
              {deal.reference_id}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(deal.deal_value, deal.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {deal.probability}% probability
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateDeal.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateDeal.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={cancelEditing}
                disabled={updateDeal.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Deal
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>

        {saveError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {saveError}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Deal
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">&quot;{dealName}&quot;</span>? All
              associated data will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteDeal.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteDeal.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDeal.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Deal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Deal Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* First Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.first_name || ""}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.first_name || "--"}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.last_name || ""}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.last_name || "--"}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">{deal.email || "--"}</p>
            )}
          </div>

          {/* Mobile No */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Mobile No
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.mobile_no || ""}
                onChange={(e) => updateField("mobile_no", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.mobile_no || "--"}
              </p>
            )}
          </div>

          {/* Organization */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Organization
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.organization_name || ""}
                onChange={(e) =>
                  updateField("organization_name", e.target.value)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.organization_name || "--"}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Status
            </label>
            {isEditing ? (
              <select
                value={editForm.status || ""}
                onChange={(e) => updateField("status", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="Qualification">Qualification</option>
                <option value="Needs Analysis">Needs Analysis</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            ) : (
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
            )}
          </div>

          {/* Deal Value */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Deal Value
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                step="1"
                value={editForm.deal_value || 0}
                onChange={(e) =>
                  updateField("deal_value", parseFloat(e.target.value) || 0)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(deal.deal_value, deal.currency)}
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Currency
            </label>
            {isEditing ? (
              <select
                value={editForm.currency || "USD"}
                onChange={(e) => updateField("currency", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{deal.currency}</p>
            )}
          </div>

          {/* Probability */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Probability
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.probability || 0}
                  onChange={(e) =>
                    updateField(
                      "probability",
                      Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            ) : (
              <p className="text-sm text-gray-900">{deal.probability}%</p>
            )}
          </div>

          {/* Expected Closure Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Expected Closure Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={editForm.expected_closure_date || ""}
                onChange={(e) =>
                  updateField("expected_closure_date", e.target.value)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.expected_closure_date
                  ? formatDate(deal.expected_closure_date)
                  : "--"}
              </p>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Source
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.source || ""}
                onChange={(e) => updateField("source", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">{deal.source || "--"}</p>
            )}
          </div>

          {/* Deal Owner */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Deal Owner
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.deal_owner_email || ""}
                onChange={(e) =>
                  updateField("deal_owner_email", e.target.value)
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="owner@example.com"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.deal_owner_name || deal.deal_owner_email || "--"}
              </p>
            )}
          </div>

          {/* Lead Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Lead Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.lead_name || ""}
                onChange={(e) => updateField("lead_name", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            ) : (
              <p className="text-sm text-gray-900">
                {deal.lead_name || "--"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Timestamps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Created At
            </label>
            <p className="text-sm text-gray-900">
              {formatDateTime(deal.created_at)}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Last Updated
            </label>
            <p className="text-sm text-gray-900">
              {formatDateTime(deal.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Product Line Items */}
      <ProductLineItems entityType="deal" entityId={dealId} />

      <ActivityTimeline entityType="deal" entityId={dealId} />
    </div>
  )
}

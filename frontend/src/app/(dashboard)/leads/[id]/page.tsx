"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads"
import type { LeadCreate } from "@/types/lead"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRightCircle,
} from "lucide-react"
import { format } from "date-fns"
import { ActivityTimeline } from "@/components/activities/ActivityTimeline"
import { ProductLineItems } from "@/components/products/ProductLineItems"
import { ConvertLeadModal } from "@/components/modals/ConvertLeadModal"
import { SLABadge } from "@/components/sla/SLABadge"

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-7 bg-gray-200 rounded w-64" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-9 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface EditableFieldProps {
  label: string
  value: string | null | undefined
  fieldKey: string
  isEditing: boolean
  formData: Record<string, string>
  onChange: (key: string, value: string) => void
  type?: "text" | "email"
}

function EditableField({
  label,
  value,
  fieldKey,
  isEditing,
  formData,
  onChange,
  type = "text",
}: EditableFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={formData[fieldKey] ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <p className="text-sm text-gray-900 py-2">
          {value || <span className="text-gray-300">&mdash;</span>}
        </p>
      )}
    </div>
  )
}

interface ReadOnlyFieldProps {
  label: string
  children: React.ReactNode
}

function ReadOnlyField({ label, children }: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="py-2">{children}</div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = Number(params.id)

  const { data: lead, isLoading, isError, error } = useLead(leadId)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Populate form data when lead is loaded or when entering edit mode
  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name ?? "",
        last_name: lead.last_name ?? "",
        email: lead.email ?? "",
        mobile_no: lead.mobile_no ?? "",
        organization: lead.organization ?? "",
        status: lead.status ?? "",
        source: lead.source ?? "",
        industry: lead.industry ?? "",
        territory: lead.territory ?? "",
        lead_owner_email: lead.lead_owner_email ?? "",
      })
    }
  }, [lead])

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancelEdit() {
    if (lead) {
      setFormData({
        first_name: lead.first_name ?? "",
        last_name: lead.last_name ?? "",
        email: lead.email ?? "",
        mobile_no: lead.mobile_no ?? "",
        organization: lead.organization ?? "",
        status: lead.status ?? "",
        source: lead.source ?? "",
        industry: lead.industry ?? "",
        territory: lead.territory ?? "",
        lead_owner_email: lead.lead_owner_email ?? "",
      })
    }
    setIsEditing(false)
  }

  async function handleSave() {
    if (!lead) return

    const updatedFields: Partial<LeadCreate> = {}

    if (formData.first_name !== lead.first_name) updatedFields.first_name = formData.first_name
    if (formData.last_name !== lead.last_name) updatedFields.last_name = formData.last_name
    if (formData.email !== lead.email) updatedFields.email = formData.email
    if (formData.mobile_no !== (lead.mobile_no ?? "")) updatedFields.mobile_no = formData.mobile_no
    if (formData.organization !== (lead.organization ?? "")) updatedFields.organization = formData.organization
    if (formData.status !== (lead.status ?? "")) updatedFields.status = formData.status
    if (formData.source !== (lead.source ?? "")) updatedFields.source = formData.source
    if (formData.industry !== (lead.industry ?? "")) updatedFields.industry = formData.industry
    if (formData.territory !== (lead.territory ?? "")) updatedFields.territory = formData.territory
    if (formData.lead_owner_email !== (lead.lead_owner_email ?? "")) updatedFields.lead_owner_email = formData.lead_owner_email

    if (Object.keys(updatedFields).length === 0) {
      setIsEditing(false)
      return
    }

    try {
      await updateLead.mutateAsync({ id: leadId, data: updatedFields })
      setIsEditing(false)
    } catch {
      // Error is surfaced via updateLead.isError
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the lead "${lead?.first_name} ${lead?.last_name}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteLead.mutateAsync(leadId)
      router.push("/leads")
    } catch {
      // Error is surfaced via deleteLead.isError
    }
  }

  function handleConverted(dealId: number) {
    setShowConvertModal(false)
    router.push(`/deals/${dealId}`)
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/leads")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-900 mb-1">Failed to load lead</h2>
          <p className="text-sm text-red-600 mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/leads")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Lead not found</h2>
          <p className="text-sm text-gray-500">The lead you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/leads")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {lead.first_name} {lead.last_name}
                </h1>
                <StatusBadge status={lead.status} color={lead.status_color} />
                {lead.converted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Converted
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {lead.reference_id}
                {lead.organization && (
                  <span>
                    {" "}
                    &middot; {lead.organization}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateLead.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateLead.isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md transition-colors",
                      updateLead.isPending
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {updateLead.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {updateLead.isPending ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  {!lead.converted && (
                    <button
                      onClick={() => setShowConvertModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                      Convert to Deal
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLead.isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      deleteLead.isPending
                        ? "bg-red-300 text-white cursor-not-allowed"
                        : "bg-white text-red-600 border border-red-300 hover:bg-red-50"
                    )}
                  >
                    {deleteLead.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleteLead.isPending ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {updateLead.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                {updateLead.error instanceof Error
                  ? updateLead.error.message
                  : "Failed to update lead. Please try again."}
              </p>
            </div>
          )}
          {deleteLead.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                {deleteLead.error instanceof Error
                  ? deleteLead.error.message
                  : "Failed to delete lead. Please try again."}
              </p>
            </div>
          )}
        </div>

        {/* Detail Fields */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Personal Information */}
            <div className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Personal Information
              </h2>
            </div>

            <EditableField
              label="First Name"
              value={lead.first_name}
              fieldKey="first_name"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Last Name"
              value={lead.last_name}
              fieldKey="last_name"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Email"
              value={lead.email}
              fieldKey="email"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
              type="email"
            />
            <EditableField
              label="Mobile No"
              value={lead.mobile_no}
              fieldKey="mobile_no"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />

            {/* Organization Details */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Organization Details
              </h2>
            </div>

            <EditableField
              label="Organization"
              value={lead.organization}
              fieldKey="organization"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Industry"
              value={lead.industry}
              fieldKey="industry"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Territory"
              value={lead.territory}
              fieldKey="territory"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />

            {/* Lead Management */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Lead Management
              </h2>
            </div>

            <EditableField
              label="Status"
              value={lead.status}
              fieldKey="status"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Source"
              value={lead.source}
              fieldKey="source"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
            />
            <EditableField
              label="Lead Owner Email"
              value={lead.lead_owner_email}
              fieldKey="lead_owner_email"
              isEditing={isEditing}
              formData={formData}
              onChange={handleFieldChange}
              type="email"
            />

            <ReadOnlyField label="Lead Owner Name">
              <p className="text-sm text-gray-900">
                {lead.lead_owner_name || <span className="text-gray-300">&mdash;</span>}
              </p>
            </ReadOnlyField>

            <ReadOnlyField label="SLA Status">
              <SLABadge slaStatus={lead.sla_status} responseBy={null} />
            </ReadOnlyField>

            <ReadOnlyField label="Converted">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  lead.converted
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {lead.converted ? "Yes" : "No"}
              </span>
            </ReadOnlyField>
          </div>
        </div>

        {/* Timestamps */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-lg">
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Created: {format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Updated: {format(new Date(lead.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Line Items */}
      <ProductLineItems entityType="lead" entityId={leadId} />

      <ActivityTimeline entityType="lead" entityId={leadId} />

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        leadId={leadId}
        leadName={`${lead.first_name} ${lead.last_name}`}
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConverted={handleConverted}
      />
    </div>
  )
}

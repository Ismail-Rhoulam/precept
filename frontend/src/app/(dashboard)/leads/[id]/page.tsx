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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

function StatusBadge({ status, color }: { status: string; color?: string }) {
  const fallbackColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-800 border-blue-200",
    Open: "bg-green-100 text-green-800 border-green-200",
    Replied: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Opportunity: "bg-purple-100 text-purple-800 border-purple-200",
    Interested: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Converted: "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Do Not Contact": "bg-red-100 text-red-800 border-red-200",
    Lost: "bg-gray-100 text-gray-600 border-gray-200",
  }

  const colorClass = fallbackColors[status] || "bg-gray-100 text-gray-700 border-gray-200"

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {isEditing ? (
        <Input
          type={type}
          value={formData[fieldKey] ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
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
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
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
        <Button
          variant="ghost"
          onClick={() => router.push("/leads")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Button>
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-gray-900 mb-1">Failed to load lead</h2>
            <p className="text-sm text-red-600 mb-4">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <Button variant="link" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/leads")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Lead not found</h2>
            <p className="text-sm text-muted-foreground">The lead you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/leads")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Button>

      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {lead.first_name} {lead.last_name}
                </h1>
                <StatusBadge status={lead.status} color={lead.status_color} />
                {lead.converted && (
                  <Badge variant="outline" className="rounded-full bg-green-100 text-green-800 border-green-200">
                    Converted
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
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
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateLead.isPending}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateLead.isPending}
                  >
                    {updateLead.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {updateLead.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  {!lead.converted && (
                    <Button
                      onClick={() => setShowConvertModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                      Convert to Deal
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleteLead.isPending}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deleteLead.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleteLead.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {updateLead.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {updateLead.error instanceof Error
                  ? updateLead.error.message
                  : "Failed to update lead. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          {deleteLead.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {deleteLead.error instanceof Error
                  ? deleteLead.error.message
                  : "Failed to delete lead. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        {/* Detail Fields */}
        <CardContent>
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
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full",
                  lead.converted
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {lead.converted ? "Yes" : "No"}
              </Badge>
            </ReadOnlyField>
          </div>
        </CardContent>

        {/* Timestamps */}
        <CardFooter className="border-t bg-muted/50 rounded-b-xl px-6 py-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
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
        </CardFooter>
      </Card>

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

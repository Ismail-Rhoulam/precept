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
import { useDeal, useUpdateDeal, useDeleteDeal } from "@/hooks/useDeals"
import { ActivityTimeline } from "@/components/activities/ActivityTimeline"
import { ProductLineItems } from "@/components/products/ProductLineItems"
import { SLABadge } from "@/components/sla/SLABadge"
import WhatsAppChat from "@/components/telephony/WhatsAppChat"
import { useWhatsAppSettings } from "@/hooks/useIntegrations"
import type { DealCreate } from "@/types/deal"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const { data: whatsAppSettings } = useWhatsAppSettings()

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading deal...</span>
      </div>
    )
  }

  // Error state
  if (isError || !deal) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/deals")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Failed to load deal
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "The deal could not be found or an error occurred."}
            </p>
            <Button
              onClick={() => router.push("/deals")}
              className="mt-4"
            >
              Return to Deals
            </Button>
          </CardContent>
        </Card>
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
      <Button
        variant="ghost"
        onClick={() => router.push("/deals")}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deals
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{dealName}</h1>
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
                {dealSlaStatus && (
                  <SLABadge slaStatus={dealSlaStatus} responseBy={null} />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {deal.reference_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(deal.deal_value, deal.currency)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {deal.probability}% probability
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={updateDeal.isPending}
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
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={updateDeal.isPending}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startEditing}>
                  <Pencil className="h-4 w-4" />
                  Edit Deal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {saveError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle>Delete Deal</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-medium">&quot;{dealName}&quot;</span>? All
            associated data will be permanently removed.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteDeal.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDeal.isPending}
            >
              {deleteDeal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Deal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* First Name */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                First Name
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.first_name || ""}
                  onChange={(e) => updateField("first_name", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.first_name || "--"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Name
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.last_name || ""}
                  onChange={(e) => updateField("last_name", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.last_name || "--"}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">{deal.email || "--"}</p>
              )}
            </div>

            {/* Mobile No */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Mobile No
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.mobile_no || ""}
                  onChange={(e) => updateField("mobile_no", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.mobile_no || "--"}
                </p>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Organization
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.organization_name || ""}
                  onChange={(e) =>
                    updateField("organization_name", e.target.value)
                  }
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.organization_name || "--"}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={editForm.status || ""}
                  onValueChange={(value) => updateField("status", value)}
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
              ) : (
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
              )}
            </div>

            {/* Deal Value */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Deal Value
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.deal_value || 0}
                  onChange={(e) =>
                    updateField("deal_value", parseFloat(e.target.value) || 0)
                  }
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(deal.deal_value, deal.currency)}
                </p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Currency
              </Label>
              {isEditing ? (
                <Select
                  value={editForm.currency || "USD"}
                  onValueChange={(value) => updateField("currency", value)}
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
              ) : (
                <p className="text-sm text-gray-900">{deal.currency}</p>
              )}
            </div>

            {/* Probability */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Probability
              </Label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
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
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ) : (
                <p className="text-sm text-gray-900">{deal.probability}%</p>
              )}
            </div>

            {/* Expected Closure Date */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Expected Closure Date
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editForm.expected_closure_date || ""}
                  onChange={(e) =>
                    updateField("expected_closure_date", e.target.value)
                  }
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
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Source
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.source || ""}
                  onChange={(e) => updateField("source", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">{deal.source || "--"}</p>
              )}
            </div>

            {/* Deal Owner */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Deal Owner
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editForm.deal_owner_email || ""}
                  onChange={(e) =>
                    updateField("deal_owner_email", e.target.value)
                  }
                  placeholder="owner@example.com"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.deal_owner_name || deal.deal_owner_email || "--"}
                </p>
              )}
            </div>

            {/* Lead Name */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Lead Name
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editForm.lead_name || ""}
                  onChange={(e) => updateField("lead_name", e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {deal.lead_name || "--"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Created At
              </Label>
              <p className="text-sm text-gray-900">
                {formatDateTime(deal.created_at)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Updated
              </Label>
              <p className="text-sm text-gray-900">
                {formatDateTime(deal.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Line Items */}
      <ProductLineItems entityType="deal" entityId={dealId} />

      <ActivityTimeline entityType="deal" entityId={dealId} />

      {/* WhatsApp Chat */}
      {whatsAppSettings?.enabled && deal.mobile_no && (
        <WhatsAppChat
          entityType="deal"
          entityId={dealId}
          phoneNumber={deal.mobile_no}
        />
      )}
    </div>
  )
}

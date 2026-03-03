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
import { useOrganization, useUpdateOrganization, useDeleteOrganization } from "@/hooks/useOrganizations"
import type { OrganizationCreate } from "@/types/organization"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-44" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !organization) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/organizations")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Organization not found or failed to load.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/organizations")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {organization.organization_name}
          </h1>
          {organization.industry && (
            <p className="mt-1 text-sm text-muted-foreground">
              {organization.industry}
              {organization.territory ? ` - ${organization.territory}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateOrganization.isPending}
              >
                {updateOrganization.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error messages */}
      {updateOrganization.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {updateOrganization.error?.message || "Failed to update organization."}
          </AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this organization?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              organization record.
            </DialogDescription>
          </DialogHeader>
          {deleteOrganization.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteOrganization.error?.message || "Failed to delete organization."}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteOrganization.isPending}
            >
              {deleteOrganization.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Organization Name</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.organization_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {organization.organization_name}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Website</Label>
              {isEditing ? (
                <Input
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-sm text-foreground">
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">No. of Employees</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={0}
                  value={formData.no_of_employees ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      no_of_employees: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {organization.no_of_employees
                    ? organization.no_of_employees.toLocaleString()
                    : "-"}
                </p>
              )}
            </div>

            {/* Annual Revenue */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Annual Revenue</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={0}
                  value={formData.annual_revenue ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      annual_revenue: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {formatRevenue(organization.annual_revenue, organization.currency)}
                </p>
              )}
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Industry</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.industry_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industry_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Industry ID"
                />
              ) : (
                <p className="text-sm text-foreground">
                  {organization.industry || "-"}
                </p>
              )}
            </div>

            {/* Territory */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Territory</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.territory_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      territory_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Territory ID"
                />
              ) : (
                <p className="text-sm text-foreground">
                  {organization.territory || "-"}
                </p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-muted-foreground">Currency</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.currency || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  placeholder="USD"
                />
              ) : (
                <p className="text-sm text-foreground">
                  {organization.currency || "-"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="py-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>
              Created: {new Date(organization.created_at).toLocaleString()}
            </span>
            <span>
              Updated: {new Date(organization.updated_at).toLocaleString()}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

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
} from "lucide-react"
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import type { ContactCreate } from "@/types/contact"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = Number(params.id)

  const { data: contact, isLoading, isError } = useContact(contactId)
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<Partial<ContactCreate>>({})

  const startEditing = () => {
    if (!contact) return
    setFormData({
      salutation: contact.salutation,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email_id: contact.email_id,
      mobile_no: contact.mobile_no,
      phone: contact.phone,
      gender: contact.gender,
      company_name: contact.company_name,
      designation: contact.designation,
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      await updateContact.mutateAsync({ id: contactId, data: formData })
      setIsEditing(false)
    } catch {
      // Error is handled by mutation state
    }
  }

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contactId)
      router.push("/contacts")
    } catch {
      // Error is handled by mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !contact) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/contacts")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Contact not found or failed to load.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/contacts")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {contact.full_name}
          </h1>
          {contact.designation && contact.company_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {contact.designation} at {contact.company_name}
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
                disabled={updateContact.isPending}
              >
                {updateContact.isPending ? (
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
      {updateContact.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {updateContact.error?.message || "Failed to update contact."}
          </AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this contact?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              contact record.
            </DialogDescription>
          </DialogHeader>
          {deleteContact.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteContact.error?.message || "Failed to delete contact."}
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
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending && (
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
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salutation */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Salutation</Label>
              {isEditing ? (
                <Select
                  value={formData.salutation || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, salutation: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Prof">Prof</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground">
                  {contact.salutation || "-"}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Gender</Label>
              {isEditing ? (
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground">
                  {contact.gender || "-"}
                </p>
              )}
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">First Name</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.first_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">{contact.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Last Name</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.last_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">{contact.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email_id: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {contact.email_id || "-"}
                </p>
              )}
            </div>

            {/* Mobile No */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Mobile No</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.mobile_no || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_no: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {contact.mobile_no || "-"}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Phone</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {contact.phone || "-"}
                </p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Company</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.company_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {contact.company_name || "-"}
                </p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-muted-foreground">Designation</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.designation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-foreground">
                  {contact.designation || "-"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="py-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>
              Created: {new Date(contact.created_at).toLocaleString()}
            </span>
            <span>
              Updated: {new Date(contact.updated_at).toLocaleString()}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

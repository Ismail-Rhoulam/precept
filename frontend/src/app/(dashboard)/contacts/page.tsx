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
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useContacts, useCreateContact } from "@/hooks/useContacts"
import type { ContactListParams, ContactCreate } from "@/types/contact"

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

export default function ContactsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [ordering, setOrdering] = useState("-created_at")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const params: ContactListParams = {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    ordering,
  }

  const { data, isLoading, isError } = useContacts(params)
  const createContact = useCreateContact()

  const [formData, setFormData] = useState<ContactCreate>({
    first_name: "",
    last_name: "",
    email_id: "",
    mobile_no: "",
    company_name: "",
    designation: "",
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
      await createContact.mutateAsync(formData)
      setShowCreateForm(false)
      setFormData({
        first_name: "",
        last_name: "",
        email_id: "",
        mobile_no: "",
        company_name: "",
        designation: "",
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your contacts and their information.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Create New Contact</CardTitle>
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
                  <Label htmlFor="create-first-name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-first-name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-last-name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="create-last-name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email_id}
                    onChange={(e) =>
                      setFormData({ ...formData, email_id: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-mobile">Mobile No</Label>
                  <Input
                    id="create-mobile"
                    type="text"
                    value={formData.mobile_no}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile_no: e.target.value })
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-company">Company</Label>
                  <Input
                    id="create-company"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-designation">Designation</Label>
                  <Input
                    id="create-designation"
                    type="text"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    placeholder="CEO"
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
                <Button type="submit" disabled={createContact.isPending}>
                  {createContact.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Contact
                </Button>
              </div>
              {createContact.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createContact.error?.message || "Failed to create contact."}
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
            placeholder="Search contacts..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} contact{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[90px]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">Failed to load contacts. Please try again.</p>
          </div>
        ) : data && data.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No contacts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try adjusting your search terms."
                : "Get started by creating a new contact."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("full_name")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Full Name
                      {getSortIcon("full_name")}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("email_id")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {getSortIcon("email_id")}
                    </div>
                  </TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead
                    onClick={() => handleSort("company_name")}
                    className="cursor-pointer select-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      Company
                      {getSortIcon("company_name")}
                    </div>
                  </TableHead>
                  <TableHead>Designation</TableHead>
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
                {data?.results.map((contact) => (
                  <TableRow
                    key={contact.id}
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {contact.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.mobile_no || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.company_name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.designation || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
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

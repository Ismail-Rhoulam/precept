"use client"

import { useState } from "react"
import {
  Package,
  Plus,
  Search,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts"
import type { Product, ProductCreate, ProductUpdate } from "@/types/product"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function truncate(str: string, maxLength: number): string {
  if (!str) return ""
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str
}

interface EditModalProps {
  product: Product
  onClose: () => void
}

function EditModal({ product, onClose }: EditModalProps) {
  const [form, setForm] = useState<ProductUpdate>({
    product_code: product.product_code,
    product_name: product.product_name,
    standard_rate: product.standard_rate,
    description: product.description,
    disabled: product.disabled,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateProduct = useUpdateProduct()

  async function handleSave() {
    setErrorMessage(null)
    try {
      await updateProduct.mutateAsync({ id: product.id, data: form })
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update product."
      )
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product Code</Label>
            <Input
              type="text"
              value={form.product_code || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, product_code: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              type="text"
              value={form.product_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, product_name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Standard Rate</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.standard_rate ?? 0}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  standard_rate: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, disabled: !prev.disabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                form.disabled ? "bg-muted-foreground/30" : "bg-green-500"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out",
                  form.disabled ? "translate-x-0" : "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {form.disabled ? "Disabled" : "Active"}
            </span>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateProduct.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsSettingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [createForm, setCreateForm] = useState<ProductCreate>({
    product_code: "",
    product_name: "",
    standard_rate: 0,
    description: "",
  })

  const pageSize = 20
  const { data, isLoading, isError } = useProducts({
    page,
    page_size: pageSize,
    search: search || undefined,
  })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const products = data?.results || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function resetCreateForm() {
    setCreateForm({
      product_code: "",
      product_name: "",
      standard_rate: 0,
      description: "",
    })
    setShowCreateForm(false)
  }

  async function handleCreate() {
    if (!createForm.product_code.trim() || !createForm.product_name.trim()) return

    try {
      await createProduct.mutateAsync(createForm)
      resetCreateForm()
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleToggleDisabled(product: Product) {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: { disabled: !product.disabled },
      })
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteProduct.mutateAsync(product.id)
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalog
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("")
                setSearchInput("")
                setPage(1)
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">
              New Product
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Product Code
                </Label>
                <Input
                  type="text"
                  value={createForm.product_code}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      product_code: e.target.value,
                    }))
                  }
                  placeholder="e.g. PROD-001"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Product Name
                </Label>
                <Input
                  type="text"
                  value={createForm.product_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Standard Rate
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.standard_rate}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      standard_rate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  type="text"
                  value={createForm.description || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description"
                />
              </div>
            </div>

            {createProduct.isError && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>
                  {createProduct.error instanceof Error
                    ? createProduct.error.message
                    : "Failed to create product."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 justify-end mt-4">
              <Button variant="outline" onClick={resetCreateForm}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !createForm.product_code.trim() ||
                  !createForm.product_name.trim() ||
                  createProduct.isPending
                }
              >
                {createProduct.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {createProduct.isPending ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading products...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-sm text-destructive">
              Failed to load products. Please try again.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "No products match your search."
                : "No products yet. Add your first product."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Product Code
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Product Name
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">
                    Standard Rate
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Description
                  </TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Created
                  </TableHead>
                  <TableHead className="w-24 text-center text-xs uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">
                      {product.product_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.standard_rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px]">
                      {truncate(product.description, 50)}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleDisabled(product)}
                        disabled={updateProduct.isPending}
                      >
                        <Badge
                          variant={product.disabled ? "secondary" : "default"}
                          className={cn(
                            "cursor-pointer",
                            product.disabled
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          )}
                        >
                          {product.disabled ? "Disabled" : "Active"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(product.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingProduct(product)}
                          title="Edit product"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(product)}
                          disabled={deleteProduct.isPending}
                          title="Delete product"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} products
                </p>
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
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
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

      {/* Error display for mutations */}
      {(updateProduct.isError || deleteProduct.isError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {updateProduct.error instanceof Error
              ? updateProduct.error.message
              : deleteProduct.error instanceof Error
                ? deleteProduct.error.message
                : "An error occurred."}
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}

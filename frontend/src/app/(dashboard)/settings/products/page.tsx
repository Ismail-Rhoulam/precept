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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
          <button
            onClick={onClose}
            disabled={updateProduct.isPending}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code
            </label>
            <input
              type="text"
              value={form.product_code || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, product_code: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={form.product_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, product_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Rate
            </label>
            <input
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, disabled: !prev.disabled }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                form.disabled ? "bg-gray-300" : "bg-green-500"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  form.disabled ? "translate-x-0" : "translate-x-5"
                )}
              />
            </button>
            <span className="text-sm text-gray-600">
              {form.disabled ? "Disabled" : "Active"}
            </span>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updateProduct.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateProduct.isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
              updateProduct.isPending
                ? "bg-primary/60 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
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
          </button>
        </div>
      </div>
    </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">
              Manage your product catalog
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setSearchInput("")
                setPage(1)
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            New Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Product Code
              </label>
              <input
                type="text"
                value={createForm.product_code}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    product_code: e.target.value,
                  }))
                }
                placeholder="e.g. PROD-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={createForm.product_name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    product_name: e.target.value,
                  }))
                }
                placeholder="Product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Standard Rate
              </label>
              <input
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={createForm.description || ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {createProduct.isError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                {createProduct.error instanceof Error
                  ? createProduct.error.message
                  : "Failed to create product."}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end mt-4">
            <button
              onClick={resetCreateForm}
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={
                !createForm.product_code.trim() ||
                !createForm.product_name.trim() ||
                createProduct.isPending
              }
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                !createForm.product_code.trim() ||
                  !createForm.product_name.trim() ||
                  createProduct.isPending
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {createProduct.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createProduct.isPending ? "Creating..." : "Create Product"}
            </button>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading products...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">
              Failed to load products. Please try again.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {search
                ? "No products match your search."
                : "No products yet. Add your first product."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Product Code
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Product Name
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Standard Rate
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Description
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                      Created
                    </th>
                    <th className="w-24 px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-700 text-xs">
                        {product.product_code}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(product.standard_rate)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                        {truncate(product.description, 50)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleDisabled(product)}
                          disabled={updateProduct.isPending}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                            product.disabled
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          )}
                          title={
                            product.disabled
                              ? "Click to enable"
                              : "Click to disable"
                          }
                        >
                          {product.disabled ? "Disabled" : "Active"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(product.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deleteProduct.isPending}
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete product"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Error display for mutations */}
      {(updateProduct.isError || deleteProduct.isError) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            {updateProduct.error instanceof Error
              ? updateProduct.error.message
              : deleteProduct.error instanceof Error
                ? deleteProduct.error.message
                : "An error occurred."}
          </p>
        </div>
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

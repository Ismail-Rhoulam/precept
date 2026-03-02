"use client"

import { useState } from "react"
import { Plus, Trash2, Loader2, Package, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useLeadProducts,
  useAddLeadProduct,
  useRemoveLeadProduct,
  useDealProducts,
  useAddDealProduct,
  useRemoveDealProduct,
} from "@/hooks/useProducts"
import type { LineItem } from "@/types/product"

interface ProductLineItemsProps {
  entityType: "lead" | "deal"
  entityId: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

interface NewLineItem {
  product_name: string
  qty: number
  rate: number
  discount_percentage: number
}

function calculateAmounts(qty: number, rate: number, discountPercentage: number) {
  const amount = qty * rate
  const discountAmount = amount * (discountPercentage / 100)
  const netAmount = amount - discountAmount
  return { amount, discountAmount, netAmount }
}

export function ProductLineItems({ entityType, entityId }: ProductLineItemsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<NewLineItem>({
    product_name: "",
    qty: 1,
    rate: 0,
    discount_percentage: 0,
  })

  // Use the right hooks based on entity type
  const leadProducts = useLeadProducts(entityType === "lead" ? entityId : 0)
  const dealProducts = useDealProducts(entityType === "deal" ? entityId : 0)
  const addLeadProduct = useAddLeadProduct()
  const removeLeadProduct = useRemoveLeadProduct()
  const addDealProduct = useAddDealProduct()
  const removeDealProduct = useRemoveDealProduct()

  const products: LineItem[] =
    entityType === "lead"
      ? leadProducts.data || []
      : dealProducts.data || []

  const isLoading =
    entityType === "lead" ? leadProducts.isLoading : dealProducts.isLoading

  const addMutation = entityType === "lead" ? addLeadProduct : addDealProduct
  const removeMutation = entityType === "lead" ? removeLeadProduct : removeDealProduct

  const totalAmount = products.reduce((sum, item) => sum + item.amount, 0)
  const totalNet = products.reduce((sum, item) => sum + item.net_amount, 0)

  const { amount: newAmount, discountAmount: newDiscountAmount, netAmount: newNetAmount } =
    calculateAmounts(newItem.qty, newItem.rate, newItem.discount_percentage)

  function resetForm() {
    setNewItem({ product_name: "", qty: 1, rate: 0, discount_percentage: 0 })
    setShowAddForm(false)
  }

  async function handleAdd() {
    if (!newItem.product_name.trim()) return

    try {
      if (entityType === "lead") {
        await addLeadProduct.mutateAsync({
          leadId: entityId,
          data: {
            product_name: newItem.product_name.trim(),
            qty: newItem.qty,
            rate: newItem.rate,
            discount_percentage: newItem.discount_percentage,
          },
        })
      } else {
        await addDealProduct.mutateAsync({
          dealId: entityId,
          data: {
            product_name: newItem.product_name.trim(),
            qty: newItem.qty,
            rate: newItem.rate,
            discount_percentage: newItem.discount_percentage,
          },
        })
      }
      resetForm()
    } catch {
      // Error surfaced via mutation state
    }
  }

  async function handleRemove(productId: number) {
    try {
      if (entityType === "lead") {
        await removeLeadProduct.mutateAsync({ leadId: entityId, productId })
      } else {
        await removeDealProduct.mutateAsync({ dealId: entityId, productId })
      }
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          {products.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {products.length}
            </span>
          )}
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading products...</span>
          </div>
        ) : products.length === 0 && !showAddForm ? (
          <div className="py-12 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No products added yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Product Name
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Qty
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Rate
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Amount
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Disc %
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Disc Amt
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">
                  Net Amount
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {item.qty}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {item.discount_percentage}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatCurrency(item.discount_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.net_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removeMutation.isPending}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Inline add form row */}
              {showAddForm && (
                <tr className="bg-blue-50/50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={newItem.product_name}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, product_name: e.target.value }))
                      }
                      placeholder="Product name"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      value={newItem.qty}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          qty: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.rate}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">
                    {formatCurrency(newAmount)}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newItem.discount_percentage}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          discount_percentage: Math.min(
                            100,
                            Math.max(0, parseFloat(e.target.value) || 0)
                          ),
                        }))
                      }
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">
                    {formatCurrency(newDiscountAmount)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(newNetAmount)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAdd}
                        disabled={!newItem.product_name.trim() || addMutation.isPending}
                        className={cn(
                          "p-1 rounded transition-colors",
                          !newItem.product_name.trim() || addMutation.isPending
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-green-600 hover:bg-green-50"
                        )}
                        title="Add"
                      >
                        {addMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={resetForm}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Cancel"
                      >
                        <span className="text-xs font-bold">x</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals row */}
            {(products.length > 0 || showAddForm) && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200 font-medium">
                  <td className="px-4 py-3 text-gray-900" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatCurrency(totalNet)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Error display */}
      {(addMutation.isError || removeMutation.isError) && (
        <div className="px-6 py-3 border-t border-red-100 bg-red-50">
          <p className="text-sm text-red-700">
            {addMutation.error instanceof Error
              ? addMutation.error.message
              : removeMutation.error instanceof Error
                ? removeMutation.error.message
                : "An error occurred while managing products."}
          </p>
        </div>
      )}
    </div>
  )
}

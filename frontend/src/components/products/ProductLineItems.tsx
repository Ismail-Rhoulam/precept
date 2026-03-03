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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Products</CardTitle>
          {products.length > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {products.length}
            </Badge>
          )}
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading products...</span>
          </div>
        ) : products.length === 0 && !showAddForm ? (
          <div className="py-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No products added yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">
                  Product Name
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Qty
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Rate
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Amount
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Disc %
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Disc Amt
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Net Amount
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.qty}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.rate)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.discount_percentage}%
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.discount_amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(item.net_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.id)}
                      disabled={removeMutation.isPending}
                      title="Remove product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Inline add form row */}
              {showAddForm && (
                <TableRow className="bg-blue-50/50">
                  <TableCell>
                    <Input
                      type="text"
                      value={newItem.product_name}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, product_name: e.target.value }))
                      }
                      placeholder="Product name"
                      className="h-8"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.qty}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          qty: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-20 h-8 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
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
                      className="w-24 h-8 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatCurrency(newAmount)}
                  </TableCell>
                  <TableCell>
                    <Input
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
                      className="w-20 h-8 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatCurrency(newDiscountAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-foreground">
                    {formatCurrency(newNetAmount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          !newItem.product_name.trim() || addMutation.isPending
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-green-600 hover:bg-green-50"
                        )}
                        onClick={handleAdd}
                        disabled={!newItem.product_name.trim() || addMutation.isPending}
                        title="Add"
                      >
                        {addMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={resetForm}
                        title="Cancel"
                      >
                        <span className="text-xs font-bold">x</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            {/* Totals row */}
            {(products.length > 0 || showAddForm) && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium text-foreground" colSpan={3}>
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(totalNet)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </CardContent>

      {/* Error display */}
      {(addMutation.isError || removeMutation.isError) && (
        <div className="px-6 pb-4">
          <Alert variant="destructive">
            <AlertDescription>
              {addMutation.error instanceof Error
                ? addMutation.error.message
                : removeMutation.error instanceof Error
                  ? removeMutation.error.message
                  : "An error occurred while managing products."}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  )
}

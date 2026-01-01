"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { reserveStockForOrder } from "@/app/actions/orders"

interface Customer {
  id: string
  name: string
  email: string | null
}

interface Product {
  id: string
  name: string
  unit_price: number
  stock_quantity: number
  reserved_quantity: number
}

interface OrderFormProps {
  customers: Customer[]
  products: Product[]
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
  available_stock?: number
}

export function OrderForm({ customers, products }: OrderFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "creating" | "success">("idle")
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: "",
    shipping_address: "",
    shipping_city: "",
    notes: "",
    payment_method: "cash",
  })

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, total: 0, available_stock: 0 },
    ])
  }

  // Fetch latest stock from DB when product is selected (for display only)
  const fetchLatestProduct = async (productId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, unit_price, stock_quantity, reserved_quantity")
      .eq("id", productId)
      .single()

    if (error || !data) {
      throw new Error("Failed to fetch latest product stock")
    }

    return data as Product
  }

  // For backorders: do NOT clamp qty to stock.
  const updateItem = async (index: number, productId: string) => {
    setError(null)

    try {
      const latest = await fetchLatestProduct(productId)
      const available = Number(latest.stock_quantity ?? 0) - Number(latest.reserved_quantity ?? 0)

      setOrderItems((prev) => {
        const next = [...prev]
        const currentQty = next[index]?.quantity ?? 1
        const safeQty = Math.max(1, currentQty)

        next[index] = {
          product_id: latest.id,
          product_name: latest.name,
          quantity: safeQty,
          unit_price: latest.unit_price,
          total: safeQty * latest.unit_price,
          available_stock: available,
        }

        return next
      })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "An error occurred while loading product stock")
    }
  }

  // Allow qty above available (backorder)
  const updateQuantity = (index: number, quantity: number) => {
    setOrderItems((prev) => {
      const next = [...prev]
      const item = next[index]
      if (!item) return prev

      const raw = Number.isFinite(quantity) ? quantity : 1
      const safe = Math.max(1, raw)

      next[index] = {
        ...item,
        quantity: safe,
        total: safe * (item.unit_price || 0),
      }
      return next
    })
  }

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const hasInvalidItems = useMemo(() => {
    if (orderItems.length === 0) return true
    if (orderItems.some((i) => !i.product_id)) return true
    if (orderItems.some((i) => i.quantity < 1)) return true
    return false
  }, [orderItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasInvalidItems) return

    setIsLoading(true)
    setStatus("creating")
    setError(null)

    const orderNumber = `ORD-${Date.now()}`

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: formData.customer_id || null,
          subtotal,
          tax,
          total,
          shipping_address: formData.shipping_address || null,
          shipping_city: formData.shipping_city || null,
          notes: formData.notes || null,
          payment_method: formData.payment_method,
          stock_deducted: false, // Will be updated when fulfilled
        })
        .select()
        .single()

      if (orderError) throw orderError

      const { error: itemsError } = await supabase.from("order_items").insert(
        orderItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          fulfilled_quantity: 0,
          backorder_quantity: item.quantity, // Initially all on backorder
        })),
      )

      if (itemsError) throw itemsError

      await reserveStockForOrder(order.id)

      await supabase.rpc("log_activity", {
        p_action: "order_created",
        p_entity_type: "order",
        p_entity_id: order.id,
        p_details: {
          order_number: order.order_number,
          subtotal,
          tax,
          total,
          item_count: orderItems.length,
        },
      })

      setStatus("success")

      setTimeout(() => {
        router.push("/admin/orders")
        router.refresh()
      }, 700)
    } catch (err: unknown) {
      setStatus("idle")
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Order Items</h2>
                <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items added yet. Click "Add Item" to start.</p>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => {
                    const available = item.available_stock ?? 0
                    const isShort = item.product_id && item.quantity > available

                    return (
                      <div key={index} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Product</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {(() => {
                                    const stock = Number(product.stock_quantity ?? 0)
                                    const reserved = Number(product.reserved_quantity ?? 0)
                                    const available = stock - reserved
                                    return `${product.name} - $${product.unit_price} (Available: ${available})`
                                  })()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {item.product_id && (
                            <p className={`text-xs ${isShort ? "text-amber-600" : "text-muted-foreground"}`}>
                              {isShort
                                ? `Available now: ${available} • Remaining will be backordered`
                                : `Available now: ${available}`}
                            </p>
                          )}
                        </div>

                        <div className="w-full sm:w-24 space-y-2">
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 1)}
                            disabled={!item.product_id || isLoading}
                          />
                        </div>

                        <div className="w-full sm:w-24 space-y-2">
                          <Label>Total</Label>
                          <Input value={`$${item.total.toFixed(2)}`} disabled />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Customer & Shipping</h2>

              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Input
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.shipping_city}
                    onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Order Summary</h2>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {status === "creating" && (
            <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating order...
            </div>
          )}

          {status === "success" && (
            <div className="rounded-md border bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Order created successfully.
            </div>
          )}

          {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={isLoading || hasInvalidItems}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

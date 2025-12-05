"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"

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
}

export function OrderForm({ customers, products }: OrderFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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
    setOrderItems([...orderItems, { product_id: "", product_name: "", quantity: 1, unit_price: 0, total: 0 }])
  }

  const updateItem = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const newItems = [...orderItems]
    newItems[index] = {
      product_id: productId,
      product_name: product.name,
      quantity: 1,
      unit_price: product.unit_price,
      total: product.unit_price,
    }
    setOrderItems(newItems)
  }

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...orderItems]
    newItems[index].quantity = quantity
    newItems[index].total = quantity * newItems[index].unit_price
    setOrderItems(newItems)
  }

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (orderItems.length === 0) {
      setError("Please add at least one item to the order")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const orderNumber = `ORD-${Date.now()}`

    try {
      // Create order
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
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const { error: itemsError } = await supabase.from("order_items").insert(
        orderItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
      )

      if (itemsError) throw itemsError

      router.push("/admin/orders")
      router.refresh()
    } catch (err: unknown) {
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
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items added yet. Click "Add Item" to start.</p>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Product</Label>
                        <Select value={item.product_id} onValueChange={(value) => updateItem(index, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${product.unit_price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24 space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 1)}
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.shipping_city}
                    onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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

          {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>
    </form>
  )
}

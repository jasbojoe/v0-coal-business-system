"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, MapPin, CreditCard, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

interface Order {
  id: string
  order_number: string
  status: string
  stock_deducted?: boolean | null
  payment_status: string
  payment_method: string | null
  subtotal: number
  tax: number
  total: number
  shipping_address: string | null
  shipping_city: string | null
  notes: string | null
  created_at: string
  customers: Customer | null
}

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  fulfilled_quantity: number
  backorder_quantity: number
  unit_price: number
  total: number
}

interface OrderDetailsProps {
  order: Order
  orderItems: OrderItem[]
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
}

export function OrderDetails({ order, orderItems }: OrderDetailsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [banner, setBanner] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" })

  // Backorder fulfillment UI state
  const [fulfillQty, setFulfillQty] = useState<Record<string, number>>({})
  const [isFulfilling, setIsFulfilling] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  const handleFulfill = async (item: OrderItem) => {
    setActionMsg(null)
    setActionErr(null)

    const qty = fulfillQty[item.id] ?? 0
    if (!qty || qty <= 0) {
      setActionErr("Enter a fulfill quantity greater than 0.")
      return
    }
    if (qty > item.backorder_quantity) {
      setActionErr(`You can only fulfill up to ${item.backorder_quantity}.`)
      return
    }

    setIsFulfilling((p) => ({ ...p, [item.id]: true }))

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("fulfill_order_item", {
        p_order_item_id: item.id,
        p_fulfill_qty: qty,
      })
      if (error) throw error

      setActionMsg("Fulfillment successful. Stock updated.")
      setFulfillQty((p) => ({ ...p, [item.id]: 0 }))
      router.refresh()
    } catch (e: any) {
      setActionErr(e?.message || "Failed to fulfill item.")
    } finally {
      setIsFulfilling((p) => ({ ...p, [item.id]: false }))
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus) return

    const prev = status
    setStatus(newStatus) // optimistic
    setIsUpdatingStatus(true)
    setBanner({ type: "idle" })

    const supabase = createClient()
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)

    if (error) {
      setStatus(prev)
      setBanner({ type: "error", message: error.message || "Failed to update status" })
      setIsUpdatingStatus(false)
      return
    }

    setBanner({ type: "success", message: "Order status updated." })
    setIsUpdatingStatus(false)
    router.refresh()
  }

  const handlePaymentStatusChange = async (newStatus: string) => {
    setPaymentStatus(newStatus)
    const supabase = createClient()
    const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", order.id)
    if (error) {
      setBanner({ type: "error", message: error.message || "Failed to update payment status" })
      setPaymentStatus(order.payment_status)
      return
    }
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Order {order.order_number}</h1>
          <p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="flex gap-2">
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger className="w-[150px]">
              <Badge variant="secondary" className={statusColors[status] || ""}>
                {status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatus} onValueChange={handlePaymentStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger className="w-[150px]">
              <Badge variant="secondary" className={paymentColors[paymentStatus] || ""}>
                {paymentStatus}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {banner.type !== "idle" && (
        <div
          className={[
            "mb-4 rounded-md border p-3 text-sm flex items-center gap-2",
            banner.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
          ].join(" ")}
        >
          {banner.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {banner.type === "error" ? <span className="font-medium">Error:</span> : null}
          <span>{banner.message}</span>
        </div>
      )}

      {actionMsg && (
        <div className="mb-3 rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {actionMsg}
        </div>
      )}
      {actionErr && <div className="mb-3 rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{actionErr}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className={isUpdatingStatus ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-center">Ordered</th>
                      <th className="pb-3 text-center">Fulfilled</th>
                      <th className="pb-3 text-center">Backorder</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3 text-right">Fulfill</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 align-top">
                        <td className="py-3 font-medium">{item.product_name}</td>

                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-center">{item.fulfilled_quantity}</td>
                        <td className="py-3 text-center">
                          <span className={item.backorder_quantity > 0 ? "text-amber-600 font-medium" : ""}>
                            {item.backorder_quantity}
                          </span>
                        </td>

                        <td className="py-3 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>

                        <td className="py-3 text-right">
                          {item.backorder_quantity > 0 && status !== "cancelled" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={item.backorder_quantity}
                                value={fulfillQty[item.id] ?? ""}
                                onChange={(e) =>
                                  setFulfillQty((p) => ({
                                    ...p,
                                    [item.id]: Math.min(
                                      item.backorder_quantity,
                                      Math.max(0, Number.parseInt(e.target.value || "0", 10)),
                                    ),
                                  }))
                                }
                                className="w-20"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleFulfill(item)}
                                disabled={!!isFulfilling[item.id]}
                              >
                                {isFulfilling[item.id] ? "..." : "Fulfill"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={5} className="py-3 text-right text-muted-foreground">
                        Subtotal
                      </td>
                      <td className="py-3 text-right">${order.subtotal.toFixed(2)}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-1 text-right text-muted-foreground">
                        Tax
                      </td>
                      <td className="py-1 text-right">${order.tax.toFixed(2)}</td>
                      <td />
                    </tr>
                    <tr className="font-semibold">
                      <td colSpan={5} className="py-3 text-right">
                        Total
                      </td>
                      <td className="py-3 text-right">${order.total.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customers ? (
                <div className="space-y-2">
                  <p className="font-medium">{order.customers.name}</p>
                  {order.customers.email && <p className="text-sm text-muted-foreground">{order.customers.email}</p>}
                  {order.customers.phone && <p className="text-sm text-muted-foreground">{order.customers.phone}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">Walk-in customer</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shipping_address ? (
                <div className="space-y-1">
                  <p>{order.shipping_address}</p>
                  {order.shipping_city && <p className="text-muted-foreground">{order.shipping_city}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">No shipping address</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize">{order.payment_method?.replace("_", " ") || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={paymentColors[paymentStatus] || ""}>
                    {paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

import { RecordPaymentModal } from "@/components/admin/record-payment-modal"
import { RefundPaymentModal } from "@/components/admin/refund-payment-modal"
import { cancelOrder, fulfillOrderItem } from "@/app/actions/orders"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  shipping_address: string | null
  shipping_city: string | null
  created_at: string
  customers: Customer | null
}

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total: number
  fulfilled_quantity: number
  backorder_quantity: number
}

interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  reference: string | null
  notes: string | null
  payment_date: string | null
  created_at: string
}

interface OrderDetailsProps {
  order: Order
  orderItems: OrderItem[]
  payments: Payment[]
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

export function OrderDetails({ order, orderItems, payments }: OrderDetailsProps) {
  const router = useRouter()

  const [status, setStatus] = useState(order.status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)

  const paidAmount = useMemo(() => {
    return (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }, [payments])

  const orderTotal = Number(order.total || 0)
  const balanceDue = Math.max(orderTotal - paidAmount, 0)
  const refundable = Math.max(paidAmount, 0)

  // fulfillment controls
  const [fulfillQty, setFulfillQty] = useState<Record<string, number>>({})
  const [isFulfilling, setIsFulfilling] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const updateOrderStatus = async (newStatus: string) => {
    if (isUpdatingStatus) return
    setIsUpdatingStatus(true)
    setErr(null)
    setMsg(null)

    const prev = status
    setStatus(newStatus)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
      if (error) throw error

      setMsg("Order status updated.")
      router.refresh()
    } catch (e: any) {
      setStatus(prev)
      setErr(e?.message || "Failed to update order status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleFulfill = async (item: OrderItem) => {
    setErr(null)
    setMsg(null)

    const qty = Number(fulfillQty[item.id] || 0)
    if (!Number.isFinite(qty) || qty <= 0) return setErr("Enter a fulfill quantity greater than 0.")
    if (qty > item.backorder_quantity) return setErr(`You can only fulfill up to ${item.backorder_quantity}.`)

    setIsFulfilling((p) => ({ ...p, [item.id]: true }))

    try {
      await fulfillOrderItem(item.id, qty)
      setMsg("Fulfillment successful. Stock updated.")
      setFulfillQty((p) => ({ ...p, [item.id]: 0 }))
      router.refresh()
    } catch (e: any) {
      setErr(e?.message || "Failed to fulfill item.")
    } finally {
      setIsFulfilling((p) => ({ ...p, [item.id]: false }))
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This will release all reserved stock.")) return

    setErr(null)
    setMsg(null)
    setIsUpdatingStatus(true)

    try {
      await cancelOrder(order.id)
      setMsg("Order cancelled successfully. Stock has been released.")
      router.refresh()
    } catch (e: any) {
      setErr(e?.message || "Failed to cancel order.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
          <p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select
            value={status}
            onValueChange={updateOrderStatus}
            disabled={isUpdatingStatus || status === "cancelled"}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={statusColors[status] || ""}>
                  {status}
                </Badge>
                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>
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

          <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
            {order.payment_status}
          </Badge>

          <Button type="button" onClick={() => setPaymentOpen(true)}>
            Record Payment
          </Button>

          <Button type="button" variant="outline" onClick={() => setRefundOpen(true)} disabled={refundable <= 0}>
            Refund
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={isUpdatingStatus || status === "cancelled"}
          >
            Cancel Order
          </Button>
        </div>
      </div>

      {err ? <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{err}</div> : null}
      {msg ? <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat label="Order Total" value={`$${orderTotal.toFixed(2)}`} />
                <Stat label="Paid" value={`$${paidAmount.toFixed(2)}`} />
                <Stat label="Balance" value={`$${balanceDue.toFixed(2)}`} />
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-2">Date</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Reference</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-muted-foreground">
                          No payments recorded
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => {
                        const amt = Number(p.amount || 0)
                        return (
                          <tr key={p.id} className="border-t">
                            <td className="p-2">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}
                            </td>
                            <td className="p-2">{p.payment_method || "—"}</td>
                            <td className="p-2">{p.reference || "—"}</td>
                            <td className="p-2 text-right font-medium">
                              {amt < 0 ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                                    REFUND
                                  </span>
                                  <span>-${Math.abs(amt).toFixed(2)}</span>
                                </span>
                              ) : (
                                <>${amt.toFixed(2)}</>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-2">Product</th>
                      <th className="p-2 text-right">Ordered</th>
                      <th className="p-2 text-right">Fulfilled</th>
                      <th className="p-2 text-right">Backorder</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2">Fulfill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.product_name}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{item.fulfilled_quantity}</td>
                        <td className="p-2 text-right">{item.backorder_quantity}</td>
                        <td className="p-2 text-right">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">${Number(item.total || 0).toFixed(2)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              className="w-[90px]"
                              value={String(fulfillQty[item.id] ?? "")}
                              onChange={(e) => setFulfillQty((p) => ({ ...p, [item.id]: Number(e.target.value || 0) }))}
                              placeholder="0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!!isFulfilling[item.id] || item.backorder_quantity <= 0}
                              onClick={() => handleFulfill(item)}
                            >
                              {isFulfilling[item.id] ? "..." : "Fulfill"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="font-medium">{order.customers?.name || "Walk-in customer"}</div>
              {order.customers?.email ? <div className="text-muted-foreground">{order.customers.email}</div> : null}
              {order.customers?.phone ? <div className="text-muted-foreground">{order.customers.phone}</div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {order.shipping_address ? (
                <>
                  <div>{order.shipping_address}</div>
                  {order.shipping_city ? <div>{order.shipping_city}</div> : null}
                </>
              ) : (
                "No shipping address"
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ Modals */}
      <RecordPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        orderId={order.id}
        orderNumber={order.order_number}
        balanceDue={balanceDue}
        onRecorded={() => router.refresh()}
      />

      <RefundPaymentModal
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderId={order.id}
        orderNumber={order.order_number}
        maxRefund={refundable}
        onRefunded={() => router.refresh()}
      />
    </div>
  )
}

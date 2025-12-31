"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

import { RecordPaymentModal } from "@/components/admin/record-payment-modal"
import { RefundPaymentModal } from "@/components/admin/refund-payment-modal"

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

interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  reference: string | null
  notes: string | null
  received_by: string | null
  payment_date: string
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
    <div className="rounded-md border bg-background p-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

export function OrderDetails({ order, orderItems, payments }: OrderDetailsProps) {
  const router = useRouter()

  const [status, setStatus] = useState(order.status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [banner, setBanner] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" })

  // ✅ these MUST be inside the component
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)

  const paidAmount = useMemo(() => {
    return (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }, [payments])

  const orderTotal = Number(order.total || 0)
  const balanceDue = Math.max(orderTotal - paidAmount, 0)
  const refundable = Math.max(paidAmount, 0)

  // fulfillment UI state
  const [fulfillQty, setFulfillQty] = useState<Record<string, number>>({})
  const [isFulfilling, setIsFulfilling] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  // cancel state
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelErr, setCancelErr] = useState<string | null>(null)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)

  const handleFulfill = async (item: OrderItem) => {
    setActionMsg(null)
    setActionErr(null)

    const qty = fulfillQty[item.id] ?? 0
    if (!qty || qty <= 0) return setActionErr("Enter a fulfill quantity greater than 0.")
    if (qty > item.backorder_quantity) return setActionErr(`You can only fulfill up to ${item.backorder_quantity}.`)

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
    setStatus(newStatus)
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

    await supabase.rpc("log_activity", {
      p_action: "order_status_changed",
      p_entity_type: "order",
      p_entity_id: order.id,
      p_details: { order_number: order.order_number, from: prev, to: newStatus },
    })

    setBanner({ type: "success", message: "Order status updated." })
    setIsUpdatingStatus(false)
    router.refresh()
  }

  const handleCancelOrder = async () => {
    setCancelErr(null)
    setCancelMsg(null)

    if (status === "cancelled") return
    if (status === "delivered") return setCancelErr("Delivered orders cannot be cancelled.")

    const ok = window.confirm(`Cancel order ${order.order_number}?\n\nThis will reverse any fulfilled stock back into inventory.`)
    if (!ok) return

    const reason = window.prompt("Reason for cancellation (optional):", "Cancelled by admin") || "Cancelled by admin"

    setIsCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("cancel_order", { p_order_id: order.id, p_reason: reason })
      if (error) throw error

      setCancelMsg("Order cancelled. Fulfilled stock was reversed back to inventory.")
      setStatus("cancelled")
      setBanner({ type: "success", message: "Order cancelled." })
      router.refresh()
    } catch (e: any) {
      setCancelErr(e?.message || "Failed to cancel order.")
    } finally {
      setIsCancelling(false)
    }
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

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus || status === "cancelled"}>
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

          {/* Payment status display only (auto-calculated) */}
          <Badge className={paymentColors[order.payment_status] || ""} variant="secondary">
            {order.payment_status}
          </Badge>

          <Button type="button" onClick={() => setPaymentOpen(true)}>
            Record Payment
          </Button>

          <Button type="button" variant="outline" onClick={() => setRefundOpen(true)} disabled={refundable <= 0}>
            Refund
          </Button>

          <Button type="button" variant="destructive" onClick={handleCancelOrder} disabled={isCancelling || status === "cancelled"}>
            Cancel
          </Button>
        </div>
      </div>

      {banner.type !== "idle" ? (
        <div className={`mb-4 rounded-md border p-3 text-sm ${banner.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
          {banner.message}
        </div>
      ) : null}

      {cancelErr ? <div className="mb-3 rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{cancelErr}</div> : null}
      {cancelMsg ? <div className="mb-3 rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{cancelMsg}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary */}
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
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Reference</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments || []).length === 0 ? (
                      <tr>
                        <td className="p-3 text-muted-foreground" colSpan={4}>
                          No payments recorded
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</td>
                          <td className="p-2">{p.payment_method || "—"}</td>
                          <td className="p-2">{p.reference || "—"}</td>
                          <td className="p-2 text-right">${Number(p.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionErr ? <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{actionErr}</div> : null}
              {actionMsg ? <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{actionMsg}</div> : null}

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
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
                      <tr key={item.id} className="border-t align-middle">
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
                              disabled={isFulfilling[item.id] || item.backorder_quantity <= 0}
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

        {/* Right column */}
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
              {order.shipping_address || "No shipping address"}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        orderId={order.id}
        balanceDue={balanceDue}
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

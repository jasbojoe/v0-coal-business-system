"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  Loader2,
  CheckCircle2,
  Ban,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { RecordPaymentModal } from "@/components/admin/record-payment-modal"
import { RefundPaymentModal } from "@/components/admin/refund-payment-modal"
import { RotateCcw } from "lucide-react"


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

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)

  const paidAmount = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const orderTotal = Number(order.total || 0)
  const balanceDue = Math.max(orderTotal - paidAmount, 0)
  const refundable = Math.max(paidAmount, 0)


  // fulfillment states
  const [fulfillQty, setFulfillQty] = useState<Record<string, number>>({})
  const [isFulfilling, setIsFulfilling] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  // cancel order states
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
      p_details: {
        order_number: order.order_number,
        from: prev,
        to: newStatus,
      },
    })

    setBanner({ type: "success", message: "Order status updated." })
    setIsUpdatingStatus(false)
    router.refresh()
  }

  const handleCancelOrder = async () => {
    setCancelErr(null)
    setCancelMsg(null)

    if (status === "cancelled") return
    if (status === "delivered") {
      setCancelErr("Delivered orders cannot be cancelled.")
      return
    }

    const ok = window.confirm(
      `Cancel order ${order.order_number}?\n\nThis will reverse any fulfilled stock back into inventory.`,
    )
    if (!ok) return

    const reason = window.prompt("Reason for cancellation (optional):", "Cancelled by admin") || "Cancelled by admin"

    setIsCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("cancel_order", {
        p_order_id: order.id,
        p_reason: reason,
      })
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

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
              {order.payment_status}
            </Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentOpen(true)}
              disabled={status === "cancelled" || balanceDue <= 0}
            >
              Record Payment
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefundOpen(true)}
              disabled={refundable <= 0}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refund
            </Button>

          </div>

          {/* ✅ Cancel button */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={isCancelling || status === "cancelled" || status === "delivered"}
            className="gap-2"
          >
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {status === "cancelled" ? "Cancelled" : "Cancel"}
          </Button>
        </div>
      </div>

      {(isUpdatingStatus || banner.type !== "idle" || cancelMsg || cancelErr) && (
        <div className="mb-6 space-y-2">
          {isUpdatingStatus && (
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating order...
            </div>
          )}
          {banner.type === "success" && (
            <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {banner.message || "Success"}
            </div>
          )}
          {banner.type === "error" && (
            <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">
              {banner.message || "An error occurred"}
            </div>
          )}
          {cancelMsg && <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{cancelMsg}</div>}
          {cancelErr && <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{cancelErr}</div>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label="Order Total" value={`$${orderTotal.toFixed(2)}`} />
                <Stat label="Paid" value={`$${paidAmount.toFixed(2)}`} />
                <Stat label="Balance" value={`$${balanceDue.toFixed(2)}`} />
              </div>

              <div className="mt-4">
                {(payments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 px-2">Method</th>
                          <th className="py-2 px-2">Reference</th>
                          <th className="py-2 pl-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {new Date(p.payment_date || p.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 px-2">{p.payment_method}</td>
                            <td className="py-2 px-2 text-muted-foreground">{p.reference || "—"}</td>
                            <td className="py-2 pl-4 text-right font-medium">
                              {Number(p.amount) < 0 ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">REFUND</span>
                                  <span>-${Math.abs(Number(p.amount)).toFixed(2)}</span>
                                </span>
                              ) : (
                                <>${Number(p.amount).toFixed(2)}</>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>

            <CardContent>
              {actionMsg && (
                <div className="mb-3 rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{actionMsg}</div>
              )}
              {actionErr && (
                <div className="mb-3 rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{actionErr}</div>
              )}

              {/* ✅ Mobile layout */}
              <div className="space-y-3 md:hidden">
                {orderItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium leading-snug">{item.product_name}</div>
                        {item.backorder_quantity > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 whitespace-nowrap">
                            Backorder {item.backorder_quantity}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 whitespace-nowrap">Fulfilled</Badge>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <Stat label="Ordered" value={item.quantity} />
                        <Stat label="Fulfilled" value={item.fulfilled_quantity} />
                        <Stat label="Remaining" value={item.quantity - item.fulfilled_quantity} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <Stat label="Price" value={`$${item.unit_price.toFixed(2)}`} />
                        <Stat label="Line Total" value={`$${item.total.toFixed(2)}`} />
                      </div>

                      {item.backorder_quantity > 0 && status !== "cancelled" ? (
                        <div className="mt-3 flex items-center gap-2">
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
                            className="w-28"
                            placeholder="Qty"
                          />
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={() => handleFulfill(item)}
                            disabled={!!isFulfilling[item.id]}
                          >
                            {isFulfilling[item.id] ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Fulfilling...
                              </span>
                            ) : (
                              "Fulfill"
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ✅ Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pr-4 whitespace-nowrap">Product</th>
                      <th className="pb-3 px-2 text-center whitespace-nowrap">Ordered</th>
                      <th className="pb-3 px-2 text-center whitespace-nowrap">Fulfilled</th>
                      <th className="pb-3 px-2 text-center whitespace-nowrap">Backorder</th>
                      <th className="pb-3 px-2 text-right whitespace-nowrap">Price</th>
                      <th className="pb-3 px-2 text-right whitespace-nowrap">Total</th>
                      <th className="pb-3 pl-4 text-right whitespace-nowrap">Fulfill</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 align-top">
                        <td className="py-3 pr-4 font-medium">{item.product_name}</td>

                        <td className="py-3 px-2 text-center">{item.quantity}</td>
                        <td className="py-3 px-2 text-center">{item.fulfilled_quantity}</td>
                        <td className="py-3 px-2 text-center">
                          {item.backorder_quantity > 0 ? (
                            <span className="font-medium text-amber-600">{item.backorder_quantity}</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">0</span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-medium">${item.total.toFixed(2)}</td>

                        <td className="py-3 pl-4 text-right">
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
                                className="w-24"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleFulfill(item)}
                                disabled={!!isFulfilling[item.id]}
                              >
                                {isFulfilling[item.id] ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    ...
                                  </span>
                                ) : (
                                  "Fulfill"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                  <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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

"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { ArrowLeft, User, MapPin, CreditCard, Package } from "lucide-react"
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
  product_name: string
  quantity: number
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

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    const supabase = createClient()
    await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    router.refresh()
  }

  const handlePaymentStatusChange = async (newStatus: string) => {
    setPaymentStatus(newStatus)
    const supabase = createClient()
    await supabase.from("orders").update({ payment_status: newStatus }).eq("id", order.id)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
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
          <Select value={status} onValueChange={handleStatusChange}>
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
          <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-center">Qty</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{item.product_name}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={3} className="py-3 text-right text-muted-foreground">
                        Subtotal
                      </td>
                      <td className="py-3 text-right">${order.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1 text-right text-muted-foreground">
                        Tax
                      </td>
                      <td className="py-1 text-right">${order.tax.toFixed(2)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td colSpan={3} className="py-3 text-right">
                        Total
                      </td>
                      <td className="py-3 text-right">${order.total.toFixed(2)}</td>
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
                  <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
                    {order.payment_status}
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

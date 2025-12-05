import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  payment_status: string
  created_at: string
  customers: { name: string } | null
}

interface RecentOrdersProps {
  orders: Order[]
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

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from your customers</CardDescription>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No orders yet. Orders will appear here once customers start placing them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Payment</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 text-sm">
                    <td className="py-3 pr-4 font-medium">{order.order_number}</td>
                    <td className="py-3 pr-4">{order.customers?.name || "N/A"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={statusColors[order.status] || ""}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium">${order.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

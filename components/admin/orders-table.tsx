"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Eye, Search, Loader2 } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_number: string
  status: string
  // from DB (kept) — but we’ll display computed status
  payment_status: string
  computed_payment_status?: "pending" | "partial" | "paid" | "refunded"
  total: number
  paid_amount?: number
  balance_due?: number
  created_at: string
  customers: { name: string; email: string } | null
}

interface OrdersTableProps {
  orders: Order[]
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
}

function money(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [tableMsg, setTableMsg] = useState<string | null>(null)
  const [tableErr, setTableErr] = useState<string | null>(null)

  const router = useRouter()

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (order.customers?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (order.customers?.email || "").toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "all" || order.status === statusFilter

      const computedPay = order.computed_payment_status || (order.payment_status as any) || "pending"
      const matchesPayment = paymentFilter === "all" || computedPay === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, search, statusFilter, paymentFilter])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating((p) => ({ ...p, [orderId]: true }))
    setTableMsg(null)
    setTableErr(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)
      if (error) throw error

      setTableMsg("Order status updated.")
      router.refresh()
    } catch (e: any) {
      setTableErr(e?.message || "Failed to update order.")
    } finally {
      setUpdating((p) => ({ ...p, [orderId]: false }))
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {tableMsg ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {tableMsg}
          </div>
        ) : null}

        {tableErr ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {tableErr}
          </div>
        ) : null}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const isBusy = !!updating[order.id]
                  const computedPay = order.computed_payment_status || (order.payment_status as any) || "pending"

                  const total = money(order.total)
                  const paid = money(order.paid_amount)
                  const balance = money(order.balance_due)

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers?.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{order.customers?.email}</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(val) => updateOrderStatus(order.id, val)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={statusColors[order.status] || ""}>
                                {order.status}
                              </Badge>
                              {isBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className={paymentColors[computedPay] || ""}>
                          {computedPay}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-medium">${total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${paid.toFixed(2)}</TableCell>

                      <TableCell className="text-right">
                        <span className={balance > 0 ? "font-medium text-rose-600" : "text-emerald-700 font-medium"}>
                          ${balance.toFixed(2)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

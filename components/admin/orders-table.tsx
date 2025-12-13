"use client"

import { useState } from "react"
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
  payment_status: string
  total: number
  created_at: string
  customers: { name: string; email: string } | null
}

interface OrdersTableProps {
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

export function OrdersTable({ orders }: OrdersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [tableMsg, setTableMsg] = useState<string | null>(null)
  const [tableErr, setTableErr] = useState<string | null>(null)

  const router = useRouter()

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customers?.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setTableMsg(null)
    setTableErr(null)
    setUpdating((p) => ({ ...p, [orderId]: true }))

    try {
      const supabase = createClient()
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)
      if (error) throw error

      setTableMsg("Order status updated.")
      router.refresh()
    } catch (e: any) {
      setTableErr(e?.message || "Failed to update order status.")
    } finally {
      setUpdating((p) => ({ ...p, [orderId]: false }))
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-col gap-2">
          {tableMsg && <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">{tableMsg}</div>}
          {tableErr && <div className="rounded-md border bg-rose-50 p-3 text-sm text-rose-800">{tableErr}</div>}
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const isBusy = !!updating[order.id]
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers?.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{order.customers?.email}</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>

                      <TableCell>
                        <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)} disabled={isBusy}>
                          <SelectTrigger className="h-8 w-[150px]">
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
                        <Badge variant="secondary" className={paymentColors[order.payment_status] || ""}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium">${order.total?.toFixed(2)}</TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
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

import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, created_at, customers(name, email)")
    .order("created_at", { ascending: false })

  const orderList = orders || []
  const orderIds = orderList.map((o) => o.id)

  // Pull payments for these orders and aggregate paid per order
  let paidByOrder: Record<string, number> = {}
  if (orderIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("order_id, amount")
      .in("order_id", orderIds)

    paidByOrder =
      (payments || []).reduce((acc: Record<string, number>, p: any) => {
        const oid = p.order_id
        const amt = Number(p.amount || 0)
        acc[oid] = (acc[oid] || 0) + (Number.isFinite(amt) ? amt : 0)
        return acc
      }, {}) || {}
  }

  // Attach computed values so table is fast + consistent
  const enriched = orderList.map((o: any) => {
    const total = Number(o.total || 0)
    const paid = paidByOrder[o.id] || 0
    const balance = Math.max(total - paid, 0)

    const computedPaymentStatus =
      paid <= 0 ? "pending" : paid + 0.00001 < total ? "partial" : "paid"

    return {
      ...o,
      paid_amount: paid,
      balance_due: balance,
      computed_payment_status: computedPaymentStatus,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>

        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/admin/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      <OrdersTable orders={enriched} />
    </div>
  )
}

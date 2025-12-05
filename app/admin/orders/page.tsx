import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name, email)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/admin/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  )
}

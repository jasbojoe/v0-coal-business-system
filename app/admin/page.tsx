import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentOrders } from "@/components/admin/recent-orders"
import { InventoryAlerts } from "@/components/admin/inventory-alerts"
import { SalesChart } from "@/components/admin/sales-chart"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard data
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: allProducts },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*, customers(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("*"),
  ])

  const lowStockProducts = (allProducts || [])
    .filter((product) => product.stock_quantity <= product.min_stock_level)
    .slice(0, 5)

  // Calculate total revenue from orders
  const { data: ordersForRevenue } = await supabase.from("orders").select("total").eq("payment_status", "paid")

  const totalRevenue = ordersForRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here is an overview of your business.</p>
      </div>

      <DashboardStats
        totalProducts={totalProducts || 0}
        totalOrders={totalOrders || 0}
        totalCustomers={totalCustomers || 0}
        totalRevenue={totalRevenue}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart />
        <InventoryAlerts products={lowStockProducts || []} />
      </div>

      <RecentOrders orders={recentOrders || []} />
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentOrders } from "@/components/admin/recent-orders"
import { InventoryAlerts } from "@/components/admin/inventory-alerts"
import { SalesChart } from "@/components/admin/sales-chart"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const startOfThisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch dashboard data
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: allProducts },
    { count: thisMonthOrders },
    { count: thisMonthCustomers },
    { data: thisMonthPayments },
    { count: lastMonthOrders },
    { count: lastMonthCustomers },
    { data: lastMonthPayments },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*, customers(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("*"),
    // This month's metrics
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfThisMonth),
    supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", startOfThisMonth),
    supabase.from("payments").select("amount").gte("created_at", startOfThisMonth),
    // Last month's metrics
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth),
    supabase.from("payments").select("amount").gte("created_at", startOfLastMonth).lt("created_at", startOfThisMonth),
  ])

  const lowStockProducts = (allProducts || [])
    .filter((product) => product.stock_quantity <= product.min_stock_level)
    .slice(0, 5)

  // Revenue = money received (sum of payments)
  const { data: paymentsForRevenue } = await supabase.from("payments").select("amount")
  const totalRevenue = paymentsForRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Products don't have time-based comparison, so we'll use active vs total
  const activeProducts = allProducts?.filter((p) => p.is_active).length || 0
  const productsChange = totalProducts ? (activeProducts / totalProducts) * 100 - 100 : 0

  const ordersChange = calculatePercentChange(thisMonthOrders || 0, lastMonthOrders || 0)
  const customersChange = calculatePercentChange(thisMonthCustomers || 0, lastMonthCustomers || 0)
  const revenueChange = calculatePercentChange(thisMonthRevenue, lastMonthRevenue)

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
        productsChange={productsChange}
        ordersChange={ordersChange}
        customersChange={customersChange}
        revenueChange={revenueChange}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart />
        <InventoryAlerts products={lowStockProducts || []} />
      </div>

      <RecentOrders orders={recentOrders || []} />
    </div>
  )
}

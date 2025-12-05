import { createServerClient } from "@/lib/supabase/server"
import { ReportsDashboard } from "@/components/admin/reports-dashboard"

export default async function ReportsPage() {
  const supabase = await createServerClient()

  // Fetch orders for reports
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(name, customer_type),
      items:order_items(quantity, unit_price, product:products(name))
    `)
    .order("created_at", { ascending: false })

  // Fetch products for inventory report
  const { data: products } = await supabase.from("products").select("*").order("stock_quantity", { ascending: true })

  // Fetch production batches
  const { data: productionBatches } = await supabase
    .from("production_batches")
    .select(`
      *,
      product:products(name)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch staff for performance report
  const { data: staff } = await supabase.from("staff").select(`
      *,
      profile:profiles(full_name, email)
    `)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">View business insights and generate reports</p>
      </div>

      <ReportsDashboard
        orders={orders || []}
        products={products || []}
        productionBatches={productionBatches || []}
        staff={staff || []}
      />
    </div>
  )
}

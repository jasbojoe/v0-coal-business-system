import { createClient } from "@/lib/supabase/server"
import { OrderForm } from "@/components/admin/order-form"

export default async function NewOrderPage() {
  const supabase = await createClient()

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("products").select("*").eq("is_active", true).order("name"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Create New Order</h1>
        <p className="text-muted-foreground">Create a new order for a customer</p>
      </div>

      <OrderForm customers={customers || []} products={products || []} />
    </div>
  )
}

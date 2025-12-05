import { createClient } from "@/lib/supabase/server"
import { ProductionBatchForm } from "@/components/admin/production-batch-form"

export default async function NewProductionBatchPage() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("id, name").eq("is_active", true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">New Production Batch</h1>
        <p className="text-muted-foreground">Record a new production batch</p>
      </div>

      <ProductionBatchForm products={products || []} />
    </div>
  )
}

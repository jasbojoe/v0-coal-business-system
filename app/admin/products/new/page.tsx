import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("product_categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in your catalog</p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}

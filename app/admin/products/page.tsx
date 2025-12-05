import { createClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/admin/products-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("product_categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
        <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductsTable products={products || []} categories={categories || []} />
    </div>
  )
}

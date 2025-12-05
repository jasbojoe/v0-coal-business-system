import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RawMaterialsTable } from "@/components/admin/raw-materials-table"
import { ProductionBatchesTable } from "@/components/admin/production-batches-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: rawMaterials }, { data: productionBatches }, { data: products }] = await Promise.all([
    supabase.from("raw_materials").select("*").order("name"),
    supabase.from("production_batches").select("*, products(name)").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").eq("is_active", true),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Inventory Management</h1>
        <p className="text-muted-foreground">Manage raw materials and production batches</p>
      </div>

      <Tabs defaultValue="raw-materials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="raw-materials">Raw Materials</TabsTrigger>
          <TabsTrigger value="production">Production Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="raw-materials" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link href="/admin/inventory/raw-materials/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Link>
            </Button>
          </div>
          <RawMaterialsTable materials={rawMaterials || []} />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link href="/admin/inventory/production/new">
                <Plus className="mr-2 h-4 w-4" />
                New Batch
              </Link>
            </Button>
          </div>
          <ProductionBatchesTable batches={productionBatches || []} products={products || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

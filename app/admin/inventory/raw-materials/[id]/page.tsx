import { createClient } from "@/lib/supabase/server"
import { RawMaterialForm } from "@/components/admin/raw-material-form"
import { notFound } from "next/navigation"

export default async function EditRawMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: material } = await supabase.from("raw_materials").select("*").eq("id", id).single()

  if (!material) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Edit Raw Material</h1>
        <p className="text-muted-foreground">Update material information</p>
      </div>

      <RawMaterialForm material={material} />
    </div>
  )
}

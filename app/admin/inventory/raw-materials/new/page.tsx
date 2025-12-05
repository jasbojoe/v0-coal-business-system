import { RawMaterialForm } from "@/components/admin/raw-material-form"

export default function NewRawMaterialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Add Raw Material</h1>
        <p className="text-muted-foreground">Add a new raw material to your inventory</p>
      </div>

      <RawMaterialForm />
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface RawMaterial {
  id: string
  name: string
  description: string | null
  material_type: string
  unit: string
  quantity: number
  min_quantity: number
  cost_per_unit: number | null
  supplier: string | null
  supplier_contact: string | null
}

interface RawMaterialFormProps {
  material?: RawMaterial
}

export function RawMaterialForm({ material }: RawMaterialFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: material?.name || "",
    description: material?.description || "",
    material_type: material?.material_type || "sawdust",
    unit: material?.unit || "kg",
    quantity: material?.quantity?.toString() || "0",
    min_quantity: material?.min_quantity?.toString() || "100",
    cost_per_unit: material?.cost_per_unit?.toString() || "",
    supplier: material?.supplier || "",
    supplier_contact: material?.supplier_contact || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const data = {
      name: formData.name,
      description: formData.description || null,
      material_type: formData.material_type,
      unit: formData.unit,
      quantity: Number.parseFloat(formData.quantity),
      min_quantity: Number.parseFloat(formData.min_quantity),
      cost_per_unit: formData.cost_per_unit ? Number.parseFloat(formData.cost_per_unit) : null,
      supplier: formData.supplier || null,
      supplier_contact: formData.supplier_contact || null,
    }

    try {
      if (material) {
        const { error } = await supabase.from("raw_materials").update(data).eq("id", material.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("raw_materials").insert(data)
        if (error) throw error
      }
      router.push("/admin/inventory")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Material Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Material Type *</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sawdust">Sawdust</SelectItem>
                      <SelectItem value="agricultural_waste">Agricultural Waste</SelectItem>
                      <SelectItem value="coconut_shell">Coconut Shell</SelectItem>
                      <SelectItem value="wood_chips">Wood Chips</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="ton">Ton</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Min Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Supplier Information</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier Name</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_contact">Supplier Contact</Label>
                  <Input
                    id="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier_contact: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : material ? "Update Material" : "Add Material"}
          </Button>
        </div>
      </div>
    </form>
  )
}

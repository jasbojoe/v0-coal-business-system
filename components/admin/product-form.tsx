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
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { logActivity } from "@/lib/activity-logger"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  category_id: string | null
  sku: string
  unit_price: number
  unit: string
  stock_quantity: number
  min_stock_level: number
  is_active: boolean
  image_url: string | null // 👈 NEW
  is_featured: boolean | null // 👈 NEW
}

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    sku: product?.sku || "",
    unit_price: product?.unit_price?.toString() || "",
    unit: product?.unit || "kg",
    stock_quantity: product?.stock_quantity?.toString() || "0",
    min_stock_level: product?.min_stock_level?.toString() || "10",
    is_active: product?.is_active ?? true,
    image_url: product?.image_url ?? "", // 👈 NEW
    is_featured: product?.is_featured ?? false, // 👈 NEW
  })

  const [isUploading, setIsUploading] = useState(false) // 👈 NEW
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const data = {
      name: formData.name,
      description: formData.description || null,
      category_id: formData.category_id || null,
      sku: formData.sku,
      unit_price: Number.parseFloat(formData.unit_price),
      unit: formData.unit,
      stock_quantity: Number.parseInt(formData.stock_quantity),
      min_stock_level: Number.parseInt(formData.min_stock_level),
      is_active: formData.is_active,
      image_url: formData.image_url || null,
      is_featured: formData.is_featured,
    }

    try {
      if (product) {
        const { error } = await supabase.from("products").update(data).eq("id", product.id)
        if (error) throw error

        await logActivity({
          action: "product_updated",
          entityType: "product",
          entityId: product.id,
          details: {
            name: formData.name,
            sku: formData.sku,
            changes: data,
          },
        })
      } else {
        const { data: newProduct, error } = await supabase.from("products").insert(data).select().single()
        if (error) throw error

        await logActivity({
          action: "product_created",
          entityType: "product",
          entityId: newProduct.id,
          details: {
            name: formData.name,
            sku: formData.sku,
            unit_price: data.unit_price,
          },
        })
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const res = await fetch("/api/upload-product-image", {
        method: "POST",
        body: formDataUpload,
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await res.json()
      setFormData((prev) => ({ ...prev, image_url: url }))
    } catch (err: any) {
      console.error(err)
      setError("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Product Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                <p className="text-xs text-muted-foreground">
                  {isUploading ? "Uploading image..." : "Upload a product packshot (PNG/JPG)."}
                </p>

                {formData.image_url && (
                  <div className="mt-2">
                    <div className="h-40 w-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <img
                        src={formData.image_url || "/placeholder.svg"}
                        alt="Product preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Pricing & Inventory</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price ($) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Min Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Status</h2>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">Product is visible and available for sale</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Show on homepage</Label>
                  <p className="text-sm text-muted-foreground">
                    Feature this product in the homepage products section (max 3 recommended)
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>
    </form>
  )
}

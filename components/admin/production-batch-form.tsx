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

interface Product {
  id: string
  name: string
}

interface ProductionBatchFormProps {
  products: Product[]
}

export function ProductionBatchForm({ products }: ProductionBatchFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    product_id: "",
    quantity_produced: "",
    production_date: new Date().toISOString().split("T")[0],
    status: "in_progress",
    quality_notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const batchNumber = `BATCH-${Date.now()}`

    try {
      const { error } = await supabase.from("production_batches").insert({
        batch_number: batchNumber,
        product_id: formData.product_id || null,
        quantity_produced: Number.parseInt(formData.quantity_produced),
        production_date: formData.production_date,
        status: formData.status,
        quality_notes: formData.quality_notes || null,
      })

      if (error) throw error

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
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Batch Information</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Produced *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity_produced}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity_produced: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Production Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.production_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        production_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="quality_check">Quality Check</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Quality Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.quality_notes}
                  onChange={(e) => setFormData({ ...formData, quality_notes: e.target.value })}
                  rows={4}
                  placeholder="Any quality observations or notes..."
                />
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
            {isLoading ? "Creating..." : "Create Batch"}
          </Button>
        </div>
      </div>
    </form>
  )
}

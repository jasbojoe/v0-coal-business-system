"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MoreHorizontal, Pencil, Trash2, Search, Plus } from "lucide-react"
import Link from "next/link"

interface RawMaterial {
  id: string
  name: string
  material_type: string
  unit: string
  quantity: number
  min_quantity: number
  cost_per_unit: number | null
  supplier: string | null
}

interface RawMaterialsTableProps {
  materials: RawMaterial[]
}

const typeLabels: Record<string, string> = {
  sawdust: "Sawdust",
  agricultural_waste: "Agricultural Waste",
  coconut_shell: "Coconut Shell",
  wood_chips: "Wood Chips",
  other: "Other",
}

export function RawMaterialsTable({ materials }: RawMaterialsTableProps) {
  const [search, setSearch] = useState("")
  const router = useRouter()

  const filteredMaterials = materials.filter((material) => material.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    const supabase = createClient()
    await supabase.from("raw_materials").delete().eq("id", id)
    router.refresh()
  }

  const handleRestock = async (id: string, currentQty: number) => {
    const quantity = prompt("Enter quantity to add:", "100")
    if (!quantity) return

    const supabase = createClient()
    await supabase
      .from("raw_materials")
      .update({
        quantity: currentQty + Number.parseFloat(quantity),
        last_restocked: new Date().toISOString(),
      })
      .eq("id", id)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No materials found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[material.material_type] || material.material_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={material.quantity <= material.min_quantity ? "font-medium text-red-600" : ""}>
                        {material.quantity} {material.unit}
                      </span>
                    </TableCell>
                    <TableCell>{material.cost_per_unit ? `$${material.cost_per_unit.toFixed(2)}` : "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{material.supplier || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          material.quantity <= material.min_quantity
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {material.quantity <= material.min_quantity ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRestock(material.id, material.quantity)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Restock
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/inventory/raw-materials/${material.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(material.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

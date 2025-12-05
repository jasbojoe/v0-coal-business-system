"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface ProductionBatch {
  id: string
  batch_number: string
  quantity_produced: number
  production_date: string
  status: string
  quality_notes: string | null
  products: { name: string } | null
}

interface Product {
  id: string
  name: string
}

interface ProductionBatchesTableProps {
  batches: ProductionBatch[]
  products: Product[]
}

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  quality_check: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  quality_check: "Quality Check",
  approved: "Approved",
  rejected: "Rejected",
}

export function ProductionBatchesTable({ batches, products }: ProductionBatchesTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      batch.products?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (batchId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("production_batches").update({ status: newStatus }).eq("id", batchId)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="quality_check">Quality Check</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No production batches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_number}</TableCell>
                    <TableCell>{batch.products?.name || "N/A"}</TableCell>
                    <TableCell>{batch.quantity_produced} units</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(batch.production_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select value={batch.status} onValueChange={(value) => handleStatusChange(batch.id, value)}>
                        <SelectTrigger className="h-8 w-[140px]">
                          <Badge variant="secondary" className={statusColors[batch.status] || ""}>
                            {statusLabels[batch.status] || batch.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="quality_check">Quality Check</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {batch.quality_notes || "-"}
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

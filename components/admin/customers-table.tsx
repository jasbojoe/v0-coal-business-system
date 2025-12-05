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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company_name: string | null
  customer_type: string
  city: string | null
  total_orders: number
  total_spent: number
}

interface CustomersTableProps {
  customers: Customer[]
}

const typeColors: Record<string, string> = {
  retail: "bg-blue-100 text-blue-800",
  wholesale: "bg-purple-100 text-purple-800",
  distributor: "bg-green-100 text-green-800",
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const router = useRouter()

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || customer.customer_type === typeFilter
    return matchesSearch && matchesType
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    const supabase = createClient()
    await supabase.from("customers").delete().eq("id", id)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Customer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.company_name && (
                          <p className="text-sm text-muted-foreground">{customer.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.email && <p>{customer.email}</p>}
                        {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeColors[customer.customer_type] || ""}>
                        {customer.customer_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.city || "N/A"}</TableCell>
                    <TableCell>{customer.total_orders}</TableCell>
                    <TableCell className="font-medium">${customer.total_spent?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/customers/${customer.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(customer.id)}
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

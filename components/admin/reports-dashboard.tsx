"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, DollarSign, Package, Users, Factory, Download, Calendar, AlertTriangle } from "lucide-react"
import { format, subDays } from "date-fns"

interface Order {
  id: string
  order_number: string
  subtotal: number
  tax: number
  total: number
  status: string
  payment_status: string
  created_at: string
  customer: { name: string; customer_type: string } | null
  items: { quantity: number; unit_price: number; product: { name: string } | null }[]
}

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
  reserved_quantity: number
  min_stock_level: number
  unit_price: number
}

type PaymentRow = {
  amount: number
  payment_date: string | null
}

interface ProductionBatch {
  id: string
  batch_number: string
  quantity_produced: number
  status: string
  created_at: string
  product: { name: string } | null
}

interface Staff {
  id: string
  role: string
  department: string | null
  is_active: boolean
  hire_date: string | null
  profile: { full_name: string | null; email: string | null } | null
}

interface ReportsDashboardProps {
  orders: Order[]
  products: Product[]
  productionBatches: ProductionBatch[]
  staff: Staff[]
}

const COLORS = ["#0D3B3B", "#E86A33", "#1A5F5F", "#F59E0B", "#10B981", "#6366F1"]

function safeNumber(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function safeDateStr(s: any): string | null {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : s
}

export function ReportsDashboard({ orders, products, productionBatches, staff }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState("30")
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [paymentsErr, setPaymentsErr] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    const days = Number.parseInt(dateRange)
    const startDate = subDays(new Date(), days)
    return orders.filter((order) => new Date(order.created_at) >= startDate)
  }, [orders, dateRange])

  // Fetch payments for selected period (Revenue = money received)
  useEffect(() => {
    const days = Number.parseInt(dateRange)
    const startDate = subDays(new Date(), days)

    const run = async () => {
      setPaymentsErr(null)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payments")
        .select("amount,payment_date")
        .gte("payment_date", startDate.toISOString())

      if (error) {
        setPayments([])
        setPaymentsErr(error.message)
        return
      }

      setPayments(
        (data || []).map((p: any) => ({
          amount: safeNumber(p.amount),
          payment_date: safeDateStr(p.payment_date),
        })),
      )
    }

    run()
  }, [dateRange])

// Sales metrics (refund-aware)
const salesMetrics = useMemo(() => {
  const totalOrders = filteredOrders.length

  const totalSalesValue = filteredOrders.reduce(
    (sum, order) => sum + safeNumber(order.total),
    0
  )

  const grossPayments = (payments || []).reduce(
    (sum, p) => sum + Math.max(safeNumber(p.amount), 0),
    0
  )

  const refunds = (payments || []).reduce(
    (sum, p) => sum + Math.abs(Math.min(safeNumber(p.amount), 0)),
    0
  )

  const netRevenue = grossPayments - refunds

  const avgOrderValue = totalOrders > 0 ? totalSalesValue / totalOrders : 0

  return {
    grossPayments,
    refunds,
    netRevenue,
    totalSalesValue,
    totalOrders,
    avgOrderValue,
  }
}, [filteredOrders, payments])


  // Sales by day chart data (revenue = payments per day)
  const salesByDay = useMemo(() => {
    const days = Number.parseInt(dateRange)
    const data: { date: string; revenue: number; orders: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, "MMM d")

      const dayOrders = filteredOrders.filter((o) => format(new Date(o.created_at), "MMM d") === dateStr)

      const dayPayments = (payments || []).filter((p) => {
        if (!p.payment_date) return false
        const d = new Date(p.payment_date)
        if (Number.isNaN(d.getTime())) return false
        return format(d, "MMM d") === dateStr
      })

      data.push({
        date: dateStr,
        revenue: dayPayments.reduce((sum, p) => sum + safeNumber(p.amount), 0),
        orders: dayOrders.length,
      })
    }

    return data.slice(-14)
  }, [filteredOrders, payments, dateRange])

  // Sales by customer type (order value, not cash collected)
  const salesByCustomerType = useMemo(() => {
    const typeMap: Record<string, number> = {}
    filteredOrders.forEach((order) => {
      const type = order.customer?.customer_type || "Unknown"
      typeMap[type] = (typeMap[type] || 0) + safeNumber(order.total)
    })
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }))
  }, [filteredOrders])

  // Order status breakdown
  const orderStatusBreakdown = useMemo(() => {
    const statusMap: Record<string, number> = {}
    filteredOrders.forEach((order) => {
      statusMap[order.status] = (statusMap[order.status] || 0) + 1
    })
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  }, [filteredOrders])

  // Inventory metrics
  const inventoryMetrics = useMemo(() => {
    const lowStock = products.filter((p) => {
      const stock = safeNumber(p.stock_quantity)
      const reserved = safeNumber(p.reserved_quantity)
      const available = stock - reserved
      return available <= safeNumber(p.min_stock_level)
    })
    const outOfStock = products.filter((p) => safeNumber(p.stock_quantity) === 0)
    const totalValue = products.reduce(
      (sum, p) => sum + safeNumber(p.stock_quantity) * safeNumber(p.unit_price),
      0,
    )
    return { lowStock: lowStock.length, outOfStock: outOfStock.length, totalValue }
  }, [products])

  // Production metrics
  const productionMetrics = useMemo(() => {
    const days = Number.parseInt(dateRange)
    const startDate = subDays(new Date(), days)
    const recentBatches = productionBatches.filter((b) => new Date(b.created_at) >= startDate)
    const totalProduced = recentBatches.reduce((sum, b) => sum + safeNumber(b.quantity_produced), 0)
    const approvedBatches = recentBatches.filter((b) => b.status === "approved")
    const inProgressBatches = recentBatches.filter((b) => b.status === "in_progress")

    return {
      totalBatches: recentBatches.length,
      totalProduced,
      approvedBatches: approvedBatches.length,
      inProgressBatches: inProgressBatches.length,
    }
  }, [productionBatches, dateRange])

  // Staff metrics
  const staffMetrics = useMemo(() => {
    const activeStaff = staff.filter((s) => s.is_active)
    const byDepartment: Record<string, number> = {}
    const byRole: Record<string, number> = {}

    activeStaff.forEach((s) => {
      const dept = s.department || "Unassigned"
      const role = s.role || "Unknown"
      byDepartment[dept] = (byDepartment[dept] || 0) + 1
      byRole[role] = (byRole[role] || 0) + 1
    })

    return {
      total: staff.length,
      active: activeStaff.length,
      byDepartment: Object.entries(byDepartment).map(([name, value]) => ({ name, value })),
      byRole: Object.entries(byRole).map(([name, value]) => ({ name, value })),
    }
  }, [staff])

  // Top products (based on order items)
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const name = item.product?.name || "Unknown"
        if (!productSales[name]) productSales[name] = { name, quantity: 0, revenue: 0 }
        productSales[name].quantity += safeNumber(item.quantity)
        productSales[name].revenue += safeNumber(item.quantity) * safeNumber(item.unit_price)
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Showing data for</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {paymentsErr ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Could not load payments (Revenue): {paymentsErr}
        </div>
      ) : null}

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Sales KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Payments</p>
                    <p className="text-2xl font-bold">Le {(salesMetrics.grossPayments ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Refunds</p>
                    <p className="text-2xl font-bold text-red-600">
                      Le {(salesMetrics.refunds ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{salesMetrics.totalOrders ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">
                      Le {(salesMetrics.avgOrderValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold">Le {(salesMetrics.netRevenue ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v: any) => `Le ${safeNumber(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#0D3B3B" strokeWidth={2} dot={{ fill: "#0D3B3B" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Customer Type</CardTitle>
                <CardDescription>Revenue breakdown by customer segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByCustomerType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {salesByCustomerType.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `Le ${safeNumber(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((product, index) => (
                      <TableRow key={product.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{safeNumber(product.quantity).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          Le {safeNumber(product.revenue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">{inventoryMetrics.lowStock}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{inventoryMetrics.outOfStock}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-2xl font-bold">Le {safeNumber(inventoryMetrics.totalValue).toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Current inventory levels by product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stock_quantity" name="Current Stock" fill="#0D3B3B" />
                    <Bar dataKey="min_stock_level" name="Min Stock Level" fill="#E86A33" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Batches</p>
                    <p className="text-2xl font-bold">{productionMetrics.totalBatches}</p>
                  </div>
                  <Factory className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Units Produced</p>
                    <p className="text-2xl font-bold">{safeNumber(productionMetrics.totalProduced).toLocaleString()}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Batches</p>
                    <p className="text-2xl font-bold text-green-600">{productionMetrics.approvedBatches}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{productionMetrics.inProgressBatches}</p>
                  </div>
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Production Batches</CardTitle>
              <CardDescription>Latest production activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionBatches.slice(0, 10).map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono">{batch.batch_number}</TableCell>
                      <TableCell>{batch.product?.name || "-"}</TableCell>
                      <TableCell className="text-right">{safeNumber(batch.quantity_produced).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            batch.status === "approved"
                              ? "default"
                              : batch.status === "in_progress"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {batch.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(batch.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{staffMetrics.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold text-green-600">{staffMetrics.active}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive Staff</p>
                    <p className="text-2xl font-bold text-red-600">{staffMetrics.total - staffMetrics.active}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-2xl font-bold">{staffMetrics.byDepartment.length}</p>
                  </div>
                  <Factory className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Staff by Department</CardTitle>
                <CardDescription>Team distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={staffMetrics.byDepartment}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {staffMetrics.byDepartment.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff by Role</CardTitle>
                <CardDescription>Team composition by role type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffMetrics.byRole}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" name="Staff Count" fill="#0D3B3B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

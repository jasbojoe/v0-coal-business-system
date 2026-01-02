import { Card, CardContent } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface DashboardStatsProps {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  productsChange: number
  ordersChange: number
  customersChange: number
  revenueChange: number
}

export function DashboardStats({
  totalProducts,
  totalOrders,
  totalCustomers,
  totalRevenue,
  productsChange,
  ordersChange,
  customersChange,
  revenueChange,
}: DashboardStatsProps) {
  const formatChange = (change: number) => {
    const absChange = Math.abs(change)
    const sign = change >= 0 ? "+" : "-"
    return `${sign}${absChange.toFixed(1)}%`
  }

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      change: productsChange,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      change: ordersChange,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      change: customersChange,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: revenueChange,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const isPositive = stat.change >= 0
        const TrendIcon = isPositive ? TrendingUp : TrendingDown

        return (
          <Card key={stat.title} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                >
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                  }`}
                >
                  <TrendIcon className="h-3 w-3" />
                  {formatChange(stat.change)}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

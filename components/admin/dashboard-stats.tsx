import { Card, CardContent } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
}

export function DashboardStats({ totalProducts, totalOrders, totalCustomers, totalRevenue }: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      change: "+12%",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      change: "+8%",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      change: "+23%",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+15%",
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

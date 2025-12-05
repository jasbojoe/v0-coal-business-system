import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface Product {
  id: string
  name: string
  stock_quantity: number
  min_stock_level: number
}

interface InventoryAlertsProps {
  products: Product[]
}

export function InventoryAlerts({ products }: InventoryAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <CardTitle>Low Stock Alerts</CardTitle>
        </div>
        <CardDescription>Products that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-card-foreground">All stocked up!</p>
            <p className="text-sm text-muted-foreground">No products are running low on stock.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-card-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">Min: {product.min_stock_level} units</p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {product.stock_quantity} left
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { createClient } from "@/lib/supabase/server"
import { OrderDetails } from "@/components/admin/order-details"
import { notFound } from "next/navigation"

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: order }, { data: orderItems }] = await Promise.all([
    supabase.from("orders").select("*, customers(*)").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ])

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <OrderDetails order={order} orderItems={orderItems || []} />
    </div>
  )
}

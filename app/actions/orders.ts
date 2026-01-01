"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function admin() {
  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY")
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function reserveStockForOrder(orderId: string) {
  const supabase = admin()

  const { error } = await supabase.rpc("reserve_stock_for_order", {
    p_order_id: orderId,
  })

  if (error) throw new Error(error.message)

  await logActivity({
    action: "inventory_updated",
    entityType: "order",
    entityId: orderId,
    details: {
      action: "stock_reserved",
      message: "Stock reserved for order",
    },
  })

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")
}

export async function cancelOrder(orderId: string) {
  const supabase = admin()

  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
  })

  if (error) throw new Error(error.message)

  await logActivity({
    action: "order_cancelled",
    entityType: "order",
    entityId: orderId,
    details: {
      message: "Order cancelled and stock released",
    },
  })

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/products")
}

export async function fulfillOrderItem(orderItemId: string, fulfillQty: number) {
  const supabase = admin()

  const { error } = await supabase.rpc("fulfill_order_item", {
    p_order_item_id: orderItemId,
    p_fulfill_qty: fulfillQty,
  })

  if (error) throw new Error(error.message)

  // Get order ID for revalidation and logging
  const { data: item } = await supabase
    .from("order_items")
    .select("order_id, product_name")
    .eq("id", orderItemId)
    .single()

  if (item) {
    await logActivity({
      action: "order_fulfilled",
      entityType: "order",
      entityId: item.order_id,
      details: {
        product: item.product_name,
        quantity: fulfillQty,
        message: `Fulfilled ${fulfillQty} units`,
      },
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${item.order_id}`)
    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")
  }
}

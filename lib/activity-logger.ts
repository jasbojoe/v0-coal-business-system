import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function adminClient() {
  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY")
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type ActivityAction =
  // Orders
  | "order_created"
  | "order_updated"
  | "order_cancelled"
  | "order_fulfilled"
  | "order_deleted"
  // Products
  | "product_created"
  | "product_updated"
  | "product_deleted"
  // Customers
  | "customer_created"
  | "customer_updated"
  | "customer_deleted"
  // Staff
  | "staff_created"
  | "staff_updated"
  | "staff_deleted"
  // Inventory
  | "inventory_updated"
  | "raw_material_created"
  | "raw_material_updated"
  | "raw_material_deleted"
  | "production_batch_created"
  | "production_batch_updated"
  | "production_batch_deleted"
  // Payments
  | "payment_recorded"
  | "payment_refunded"
  // Settings
  | "company_settings_updated"
  // Auth
  | "user_login"
  | "user_logout"
  | "user_signup"

export type EntityType =
  | "order"
  | "product"
  | "customer"
  | "staff"
  | "inventory"
  | "raw_material"
  | "production_batch"
  | "payment"
  | "company_settings"
  | "user"

export async function logActivity(params: {
  action: ActivityAction
  entityType: EntityType
  entityId?: string | null
  details?: Record<string, any>
  userId?: string | null
}) {
  const supabase = adminClient()

  try {
    const { error } = await supabase.from("activity_logs").insert({
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      user_id: params.userId || null,
      details: params.details || null,
    })

    if (error) {
      console.error("[Activity Log] Failed to log activity:", error)
    }
  } catch (err) {
    console.error("[Activity Log] Exception logging activity:", err)
  }
}

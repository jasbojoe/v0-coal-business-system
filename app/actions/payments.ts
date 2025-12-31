"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function recomputePaymentStatus(orderId: string) {
  // Pull order total
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id,total")
    .eq("id", orderId)
    .single()

  if (orderErr) throw orderErr

  // Sum payments (refunds are negative amounts)
  const { data: rows, error: sumErr } = await supabaseAdmin
    .from("payments")
    .select("amount")
    .eq("order_id", orderId)

  if (sumErr) throw sumErr

  const paid = (rows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
  const total = Number(order.total || 0)

  let payment_status: "pending" | "partial" | "paid" | "refunded" = "pending"

  if (paid <= 0) payment_status = "pending"
  else if (paid >= total) payment_status = "paid"
  else payment_status = "partial"

  // OPTIONAL: if you ever want to mark "refunded" only when order is fully refunded,
  // you can add that logic here later.

  const { error: updErr } = await supabaseAdmin.from("orders").update({ payment_status }).eq("id", orderId)
  if (updErr) throw updErr
}

export async function recordPayment(
  orderId: string,
  amount: number,
  method: string,
  reference: string | null,
  notes: string | null,
) {
  if (!orderId) throw new Error("Missing orderId")
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount")

  const { error } = await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    amount,
    payment_method: method,
    reference,
    notes,
    payment_date: new Date().toISOString(),
  })
  if (error) throw error

  await recomputePaymentStatus(orderId)
  revalidatePath(`/admin/orders/${orderId}`)
}

export async function refundPayment(
  orderId: string,
  refundAmount: number,
  method: string,
  reference: string | null,
  notes: string | null,
) {
  if (!orderId) throw new Error("Missing orderId")
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) throw new Error("Invalid refund amount")

  // Store refunds as NEGATIVE payment rows
  const { error } = await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    amount: -Math.abs(refundAmount),
    payment_method: method,
    reference,
    notes,
    payment_date: new Date().toISOString(),
  })
  if (error) throw error

  await recomputePaymentStatus(orderId)
  revalidatePath(`/admin/orders/${orderId}`)
}

"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// ✅ accept either env name (people often mismatch these)
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY

function admin() {
  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY")
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function recomputePaymentStatus(orderId: string) {
  const supabase = admin()

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,total")
    .eq("id", orderId)
    .single()
  if (orderErr) throw new Error(orderErr.message)

  const { data: rows, error: rowsErr } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", orderId)
  if (rowsErr) throw new Error(rowsErr.message)

  const paid = (rows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
  const total = Number(order.total || 0)

  const payment_status =
    paid <= 0 ? "pending" : paid + 0.00001 < total ? "partial" : "paid"

  const { error: updErr } = await supabase.from("orders").update({ payment_status }).eq("id", orderId)
  if (updErr) throw new Error(updErr.message)
}

export async function recordPayment(orderId: string, amount: number, method: string, reference: string | null, notes: string | null) {
  const supabase = admin()
  if (!orderId) throw new Error("Missing orderId")
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount")

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    payment_method: method,
    reference,
    notes,
    payment_date: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)

  await recomputePaymentStatus(orderId)

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath(`/admin/orders`)
  revalidatePath(`/admin/reports`)
}

export async function refundPayment(orderId: string, refundAmount: number, method: string, reference: string | null, notes: string | null) {
  const supabase = admin()
  if (!orderId) throw new Error("Missing orderId")
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) throw new Error("Invalid refund amount")

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    amount: -Math.abs(refundAmount),
    payment_method: method,
    reference,
    notes,
    payment_date: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)

  await recomputePaymentStatus(orderId)

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath(`/admin/orders`)
  revalidatePath(`/admin/reports`)
}

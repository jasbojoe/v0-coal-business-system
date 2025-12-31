"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY (add it in Vercel → Project → Settings → Environment Variables)")
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function recomputePaymentStatus(orderId: string) {
  const supabaseAdmin = getAdminClient()

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id,total")
    .eq("id", orderId)
    .single()

  if (orderErr) throw orderErr

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

  const supabaseAdmin = getAdminClient()

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
  revalidatePath(`/admin/orders`)
  revalidatePath(`/admin/reports`)
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

  const supabaseAdmin = getAdminClient()

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
  revalidatePath(`/admin/orders`)
  revalidatePath(`/admin/reports`)
}

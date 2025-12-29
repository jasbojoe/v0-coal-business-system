"use server"

import { createClient } from "@/lib/supabase/server"

type RecordPaymentArgs = {
  orderId: string
  amount: number
  paymentMethod: string
  reference?: string | null
  notes?: string | null
}

export async function recordPayment({
  orderId,
  amount,
  paymentMethod,
  reference = null,
  notes = null,
}: RecordPaymentArgs) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("Not authenticated")

  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  // Validate against current balance due (prevents overpayment)
  const [{ data: orderRow, error: orderErr }, { data: paymentRows, error: payErr }] = await Promise.all([
    supabase.from("orders").select("id,total,order_number").eq("id", orderId).single(),
    supabase.from("payments").select("amount").eq("order_id", orderId),
  ])

  if (orderErr) throw new Error(orderErr.message)
  if (payErr) throw new Error(payErr.message)

  const orderTotal = Number(orderRow?.total || 0)
  const alreadyPaid = (paymentRows || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const balanceDue = Math.max(orderTotal - alreadyPaid, 0)

  if (numericAmount > balanceDue + 1e-9) {
    throw new Error(`Amount exceeds balance due ($${balanceDue.toFixed(2)})`)
  }

  const { error: insertError } = await supabase.from("payments").insert({
    order_id: orderId,
    amount: numericAmount,
    payment_method: paymentMethod,
    reference,
    notes,
    received_by: user.id,
  })

  if (insertError) throw new Error(insertError.message)

  // Optional: activity log (if log_activity rpc exists)
  await supabase.rpc("log_activity", {
    p_action: "payment_recorded",
    p_entity_type: "order",
    p_entity_id: orderId,
    p_details: {
      order_number: orderRow?.order_number,
      amount: numericAmount,
      payment_method: paymentMethod,
      reference,
    },
  })
}

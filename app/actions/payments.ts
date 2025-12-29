"use server"

import { createClient } from "@/lib/supabase/server"

export async function recordPayment(
  orderId: string,
  amount: number,
  method: string,
  reference: string | null,
  notes: string | null
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    payment_method: method,
    reference,
    notes,
    received_by: user.id,
  })

  if (error) throw error
}

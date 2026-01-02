import { NextResponse } from "next/server"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, orderNumber, orderItems, total, orderDate } = body

    if (!customerName || !customerEmail || !orderNumber || !orderItems || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sendOrderConfirmationEmail({
      customerName,
      customerEmail,
      orderNumber,
      orderItems,
      total,
      orderDate,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in send-order-confirmation route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

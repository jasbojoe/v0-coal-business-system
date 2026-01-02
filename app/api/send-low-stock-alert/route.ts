import { NextResponse } from "next/server"
import { sendLowStockAlert } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productName, currentStock, minStock, sku } = body

    if (!productName || currentStock === undefined || !minStock || !sku) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sendLowStockAlert({
      productName,
      currentStock,
      minStock,
      sku,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in send-low-stock-alert route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

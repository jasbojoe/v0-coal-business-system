import { NextResponse } from "next/server"
import { sendInquiryNotificationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message, submittedAt } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sendInquiryNotificationEmail({
      name,
      email,
      phone,
      message,
      submittedAt,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in send-inquiry-notification route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from("contact_inquiries").insert([formData])

      if (dbError) throw dbError

      const emailResponse = await fetch("/api/send-inquiry-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!emailResponse.ok) {
        console.error("Failed to send email notification")
      }

      setSuccess(true)
      setFormData({ name: "", email: "", phone: "", message: "" })
    } catch (err: any) {
      setError(err.message || "Failed to submit form")
    } finally {
      setLoading(false)
    }
  }
}
